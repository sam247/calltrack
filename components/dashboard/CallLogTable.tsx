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
import { Phone, PhoneIncoming, PhoneMissed, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { format } from "date-fns";

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

export function CallLogTable() {
  const { currentWorkspace } = useWorkspace();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

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
        .limit(20);

      if (error) {
        console.error("Error fetching calls:", error);
      } else {
        setCalls(data || []);
      }
      setLoading(false);
    }

    fetchCalls();
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
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Caller</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Duration</TableHead>
            <TableHead className="font-semibold">Source</TableHead>
            <TableHead className="font-semibold">Campaign</TableHead>
            <TableHead className="font-semibold">Landing Page</TableHead>
            <TableHead className="font-semibold">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => {
            const status = statusConfig[call.status];
            return (
              <TableRow key={call.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  {call.caller_name || call.caller_number}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="gap-1">
                    <status.icon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                <TableCell>{call.source || "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {call.campaign || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-32 truncate">
                  {call.landing_page || "-"}
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
