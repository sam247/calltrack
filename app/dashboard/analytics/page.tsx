'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ConversionFunnel } from "@/components/dashboard/ConversionFunnel";
import { SourcePerformance } from "@/components/dashboard/SourcePerformance";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { Database } from '@/integrations/supabase/types';

type CallLog = Database['public']['Tables']['call_logs']['Row'];

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspace();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRevenuePerCall, setAverageRevenuePerCall] = useState(100);
  const [sourceCosts, setSourceCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchCalls() {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('call_logs')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .gte('call_started_at', dateRange.from.toISOString())
          .lte('call_started_at', dateRange.to.toISOString())
          .order('call_started_at', { ascending: false });

        if (error) throw error;
        setCalls(data || []);
      } catch (error) {
        console.error('Error fetching calls:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCalls();
  }, [currentWorkspace, dateRange]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-border p-8 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
            <p className="text-muted-foreground mt-2">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground">
              ROI calculations, conversion funnels, and performance metrics
            </p>
          </div>
          <DateFilter onDateChange={setDateRange} />
        </div>

        {/* Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ROI Settings</CardTitle>
            <CardDescription>
              Configure revenue and cost assumptions for ROI calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="revenue">Average Revenue per Completed Call</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={averageRevenuePerCall}
                  onChange={(e) => setAverageRevenuePerCall(Number(e.target.value))}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="costs">Source Costs (JSON)</Label>
                <Input
                  id="costs"
                  type="text"
                  placeholder='{"google:paid": 50, "facebook:social": 30}'
                  onChange={(e) => {
                    try {
                      const costs = JSON.parse(e.target.value || '{}');
                      setSourceCosts(costs);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="funnel" className="space-y-6">
          <TabsList>
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="space-y-6">
            <ConversionFunnel calls={calls} />
          </TabsContent>

          <TabsContent value="roi" className="space-y-6">
            <SourcePerformance
              calls={calls}
              sourceCosts={sourceCosts}
              averageRevenuePerCall={averageRevenuePerCall}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

