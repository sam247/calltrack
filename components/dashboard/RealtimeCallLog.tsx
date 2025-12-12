'use client'

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOff, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface CallLog {
  id: string;
  caller_number: string;
  caller_name: string | null;
  duration_seconds: number;
  source: string | null;
  campaign: string | null;
  landing_page: string | null;
  status: "completed" | "missed" | "voicemail" | "abandoned";
  call_started_at: string;
  twilio_call_sid: string | null;
}

const statusConfig = {
  completed: {
    label: "Answered",
    variant: "default" as const,
    icon: PhoneIncoming,
  },
  missed: {
    label: "Missed",
    variant: "destructive" as const,
    icon: PhoneMissed,
  },
  voicemail: {
    label: "Voicemail",
    variant: "secondary" as const,
    icon: Phone,
  },
  abandoned: {
    label: "Abandoned",
    variant: "outline" as const,
    icon: PhoneOff,
  },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function RealtimeCallLog() {
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCalls, setActiveCalls] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchCalls() {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("call_started_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching calls:", error);
      } else {
        setCalls(data || []);
        // Identify active calls (recent calls without end time or status)
        const active = new Set(
          (data || [])
            .filter(
              (call) =>
                !call.status ||
                call.status === "ringing" ||
                (new Date(call.call_started_at).getTime() > Date.now() - 60000 &&
                  !call.status)
            )
            .map((call) => call.id)
        );
        setActiveCalls(active);
      }
      setLoading(false);
    }

    fetchCalls();

    if (!currentWorkspace) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`call_logs:${currentWorkspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_logs",
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        (payload) => {
          console.log("Real-time update:", payload);

          if (payload.eventType === "INSERT") {
            const newCall = payload.new as CallLog;
            setCalls((prev) => [newCall, ...prev].slice(0, 50));
            setActiveCalls((prev) => new Set([...prev, newCall.id]));
          } else if (payload.eventType === "UPDATE") {
            const updatedCall = payload.new as CallLog;
            setCalls((prev) =>
              prev.map((call) => (call.id === updatedCall.id ? updatedCall : call))
            );
            // Remove from active if completed
            if (
              updatedCall.status === "completed" ||
              updatedCall.status === "missed" ||
              updatedCall.status === "abandoned"
            ) {
              setActiveCalls((prev) => {
                const next = new Set(prev);
                next.delete(updatedCall.id);
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    // Also subscribe to call_events for more granular updates
    const eventsChannel = supabase
      .channel(`call_events:${currentWorkspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_events",
        },
        async (payload) => {
          const event = payload.new as any;
          if (event.workspace_id === currentWorkspace.id) {
            // Refresh the call log to get updated status
            const { data: updatedCall } = await supabase
              .from("call_logs")
              .select("*")
              .eq("id", event.call_log_id)
              .single();

            if (updatedCall) {
              setCalls((prev) =>
                prev.map((call) =>
                  call.id === updatedCall.id ? (updatedCall as CallLog) : call
                )
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(eventsChannel);
    };
  }, [currentWorkspace]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
        <p className="text-muted-foreground mt-2">Loading calls...</p>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-1">No calls yet</h3>
        <p className="text-sm text-muted-foreground">
          Calls will appear here once you start receiving them.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      {activeCalls.size > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
            <PhoneCall className="h-4 w-4 animate-pulse" />
            <span>
              {activeCalls.size} active call{activeCalls.size > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Caller</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Duration</TableHead>
            <TableHead className="font-semibold">Source</TableHead>
            <TableHead className="font-semibold">Campaign</TableHead>
            <TableHead className="font-semibold">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => {
            const status = statusConfig[call.status] || statusConfig.completed;
            const isActive = activeCalls.has(call.id);
            return (
              <TableRow
                key={call.id}
                className={`cursor-pointer ${isActive ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                onClick={() => router.push(`/dashboard/calls/${call.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {call.caller_name || call.caller_number}
                    {isActive && (
                      <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="gap-1">
                    <status.icon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {call.duration_seconds > 0
                    ? formatDuration(call.duration_seconds)
                    : isActive
                    ? "In progress..."
                    : "-"}
                </TableCell>
                <TableCell>{call.source || "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {call.campaign || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(call.call_started_at), "MMM d, h:mm a")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

