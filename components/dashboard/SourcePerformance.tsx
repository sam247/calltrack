'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { calculateROI } from "@/lib/analytics/roi";
import type { Database } from '@/integrations/supabase/types';
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

type CallLog = Database['public']['Tables']['call_logs']['Row'];

interface SourcePerformanceProps {
  calls: CallLog[];
  sourceCosts?: Record<string, number>;
  averageRevenuePerCall?: number;
}

export function SourcePerformance({
  calls,
  sourceCosts = {},
  averageRevenuePerCall = 0,
}: SourcePerformanceProps) {
  const roiData = calculateROI(calls, sourceCosts, averageRevenuePerCall);

  const chartData = roiData.slice(0, 10).map(source => ({
    source: source.source,
    medium: source.medium,
    roi: Math.round(source.roi * 10) / 10,
    revenue: Math.round(source.revenue),
    cost: Math.round(source.totalCost),
    profit: Math.round(source.profit),
    calls: source.totalCalls,
    completed: source.completedCalls,
  }));

  return (
    <div className="space-y-6">
      {/* ROI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">
                ${roiData.reduce((sum, s) => sum + s.revenue, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">
                ${roiData.reduce((sum, s) => sum + s.totalCost, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">
                ${roiData.reduce((sum, s) => sum + s.profit, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {roiData.length > 0 ? (
                <>
                  {roiData.reduce((sum, s) => sum + s.roi, 0) / roiData.length > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <p className="text-2xl font-bold">
                    {Math.round(
                      (roiData.reduce((sum, s) => sum + s.roi, 0) / roiData.length) * 10
                    ) / 10}%
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold">-</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Chart */}
      <Card>
        <CardHeader>
          <CardTitle>ROI by Source</CardTitle>
          <CardDescription>
            Return on investment for each traffic source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
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
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'roi') return [`${value}%`, 'ROI'];
                  if (name === 'revenue' || name === 'cost' || name === 'profit') {
                    return [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="roi" fill="#0088FE" name="ROI %" />
              <Bar yAxisId="right" dataKey="revenue" fill="#00C49F" name="Revenue" />
              <Bar yAxisId="right" dataKey="cost" fill="#FF8042" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
          <CardDescription>
            Detailed ROI metrics for each source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Medium</th>
                  <th className="text-right p-2">Calls</th>
                  <th className="text-right p-2">Completed</th>
                  <th className="text-right p-2">Cost</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Profit</th>
                  <th className="text-right p-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {roiData.map((source, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{source.source}</td>
                    <td className="p-2">
                      <Badge variant="outline">{source.medium}</Badge>
                    </td>
                    <td className="text-right p-2">{source.totalCalls}</td>
                    <td className="text-right p-2">{source.completedCalls}</td>
                    <td className="text-right p-2">
                      ${Math.round(source.totalCost).toLocaleString()}
                    </td>
                    <td className="text-right p-2">
                      ${Math.round(source.revenue).toLocaleString()}
                    </td>
                    <td className="text-right p-2">
                      <span className={source.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${Math.round(source.profit).toLocaleString()}
                      </span>
                    </td>
                    <td className="text-right p-2">
                      <div className="flex items-center justify-end gap-1">
                        {source.roi >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        {Math.round(source.roi * 10) / 10}%
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

