import { useEffect, useState } from "react";
import { Phone, TrendingUp, Clock, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

interface Stats {
  totalCalls: number;
  completedCalls: number;
  avgDuration: number;
  conversionRate: number;
}

export function StatsCards() {
  const { currentWorkspace } = useWorkspace();
  const [stats, setStats] = useState<Stats>({
    totalCalls: 0,
    completedCalls: 0,
    avgDuration: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Get call counts
      const { data: calls, error } = await supabase
        .from("call_logs")
        .select("status, duration_seconds")
        .eq("workspace_id", currentWorkspace.id);

      if (error) {
        console.error("Error fetching stats:", error);
        setLoading(false);
        return;
      }

      type CallData = { status: string; duration_seconds: number | null };
      const typedCalls = (calls || []) as CallData[];

      const totalCalls = typedCalls.length;
      const completedCalls = typedCalls.filter((c) => c.status === "completed").length;
      const totalDuration = typedCalls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
      const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
      const conversionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

      setStats({
        totalCalls,
        completedCalls,
        avgDuration,
        conversionRate,
      });
      setLoading(false);
    }

    fetchStats();
  }, [currentWorkspace]);

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const statCards = [
    {
      title: "Total Calls",
      value: loading ? "-" : stats.totalCalls.toLocaleString(),
      icon: Phone,
    },
    {
      title: "Answered Calls",
      value: loading ? "-" : stats.completedCalls.toLocaleString(),
      icon: Target,
    },
    {
      title: "Avg Duration",
      value: loading ? "-" : formatDuration(stats.avgDuration),
      icon: Clock,
    },
    {
      title: "Answer Rate",
      value: loading ? "-" : `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{stat.title}</span>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
