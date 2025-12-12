'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { buildConversionFunnel } from "@/lib/analytics/roi";
import type { Database } from '@/integrations/supabase/types';

type CallLog = Database['public']['Tables']['call_logs']['Row'];

interface ConversionFunnelProps {
  calls: CallLog[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ConversionFunnel({ calls }: ConversionFunnelProps) {
  const funnel = buildConversionFunnel(calls);

  const chartData = funnel.map((stage, index) => ({
    name: stage.stage,
    count: stage.count,
    percentage: Math.round(stage.percentage * 10) / 10,
    dropoff: Math.round(stage.dropoff * 10) / 10,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>
          Track call progression from initiation to qualification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Funnel Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'count') return [value, 'Count'];
                  if (name === 'percentage') return [`${value}%`, 'Conversion Rate'];
                  if (name === 'dropoff') return [`${value}%`, 'Dropoff Rate'];
                  return value;
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#0088FE" name="Count" />
            </BarChart>
          </ResponsiveContainer>

          {/* Funnel Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Stage</th>
                  <th className="text-right p-2">Count</th>
                  <th className="text-right p-2">Conversion Rate</th>
                  <th className="text-right p-2">Dropoff Rate</th>
                </tr>
              </thead>
              <tbody>
                {funnel.map((stage, index) => (
                  <tr key={stage.stage} className="border-b">
                    <td className="p-2 font-medium">{stage.stage}</td>
                    <td className="text-right p-2">{stage.count}</td>
                    <td className="text-right p-2">
                      {Math.round(stage.percentage * 10) / 10}%
                    </td>
                    <td className="text-right p-2">
                      {index > 0 ? `${Math.round(stage.dropoff * 10) / 10}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

