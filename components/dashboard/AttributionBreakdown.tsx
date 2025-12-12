'use client'

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { TrendingUp, Phone, Users } from "lucide-react";

interface AttributionBreakdownProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface SourceMetrics {
  source: string;
  medium: string;
  calls: number;
  completedCalls: number;
  totalDuration: number;
  uniqueCallers: number;
  conversionRate: number;
}

export function AttributionBreakdown({ dateRange }: AttributionBreakdownProps) {
  const { currentWorkspace } = useWorkspace();
  const [sources, setSources] = useState<SourceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBreakdown() {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch call logs with attribution data
        const { data: calls, error } = await supabase
          .from('call_logs')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .gte('call_started_at', dateRange.from.toISOString())
          .lte('call_started_at', dateRange.to.toISOString())
          .order('call_started_at', { ascending: false });

        if (error) throw error;

        // Aggregate by source/medium
        const sourceMap = new Map<string, SourceMetrics>();
        const callerMap = new Map<string, Set<string>>(); // source -> set of caller numbers

        (calls || []).forEach((call: any) => {
          const source = call.utm_source || call.source || 'direct';
          const medium = call.utm_medium || 'none';
          const key = `${source}:${medium}`;

          if (!sourceMap.has(key)) {
            sourceMap.set(key, {
              source,
              medium,
              calls: 0,
              completedCalls: 0,
              totalDuration: 0,
              uniqueCallers: 0,
              conversionRate: 0,
            });
            callerMap.set(key, new Set());
          }

          const metrics = sourceMap.get(key)!;
          metrics.calls += 1;
          
          if (call.status === 'completed') {
            metrics.completedCalls += 1;
            metrics.totalDuration += call.duration_seconds || 0;
          }

          if (call.caller_number) {
            callerMap.get(key)!.add(call.caller_number);
          }
        });

        // Calculate unique callers and conversion rates
        const sourceMetrics: SourceMetrics[] = Array.from(sourceMap.values()).map(metrics => {
          const key = `${metrics.source}:${metrics.medium}`;
          const uniqueCallers = callerMap.get(key)?.size || 0;
          return {
            ...metrics,
            uniqueCallers,
            conversionRate: metrics.calls > 0 ? (metrics.completedCalls / metrics.calls) * 100 : 0,
          };
        });

        // Sort by calls descending
        sourceMetrics.sort((a, b) => b.calls - a.calls);
        setSources(sourceMetrics);

        // Generate time series data
        const daysDiff = Math.ceil(
          (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
        );
        const timeSeriesData: any[] = [];

        for (let i = 0; i <= daysDiff; i++) {
          const date = new Date(dateRange.from);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];

          const dayCalls = (calls || []).filter((call: any) => {
            const callDate = new Date(call.call_started_at).toISOString().split('T')[0];
            return callDate === dateStr;
          });

          const completed = dayCalls.filter((c: any) => c.status === 'completed').length;

          timeSeriesData.push({
            date: dateStr,
            calls: dayCalls.length,
            completed,
          });
        }

        setTimeSeries(timeSeriesData);
      } catch (error) {
        console.error('Error fetching breakdown:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBreakdown();
  }, [currentWorkspace, dateRange]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
        <p className="text-muted-foreground mt-2">Loading source breakdown...</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Call Volume Over Time</CardTitle>
          <CardDescription>
            Track calls and completions by day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="calls"
                stroke="#0088FE"
                name="Total Calls"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#00C49F"
                name="Completed Calls"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Source Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
          <CardDescription>
            Compare call volume and completion rates by source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sources.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="source"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="calls" fill="#0088FE" name="Total Calls" />
              <Bar yAxisId="left" dataKey="completedCalls" fill="#00C49F" name="Completed" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversionRate"
                stroke="#FF8042"
                name="Conversion Rate %"
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Source Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Source Metrics</CardTitle>
          <CardDescription>
            Detailed performance metrics for each source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Medium</th>
                  <th className="text-right p-2">Total Calls</th>
                  <th className="text-right p-2">Completed</th>
                  <th className="text-right p-2">Unique Callers</th>
                  <th className="text-right p-2">Total Duration</th>
                  <th className="text-right p-2">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{source.source}</td>
                    <td className="p-2">
                      <Badge variant="outline">{source.medium}</Badge>
                    </td>
                    <td className="text-right p-2">{source.calls}</td>
                    <td className="text-right p-2">{source.completedCalls}</td>
                    <td className="text-right p-2">{source.uniqueCallers}</td>
                    <td className="text-right p-2">{formatDuration(source.totalDuration)}</td>
                    <td className="text-right p-2">
                      <div className="flex items-center justify-end gap-1">
                        {source.conversionRate.toFixed(1)}%
                        {source.conversionRate > 50 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : source.conversionRate < 30 ? (
                          <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

