'use client'

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { AttributionModel } from "@/lib/attribution/models";
import { aggregateAttributionWeights } from "@/lib/attribution/models";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AttributionModelsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface ModelComparison {
  model: AttributionModel;
  sourceBreakdown: Record<string, number>;
  totalConversions: number;
}

const MODEL_LABELS: Record<AttributionModel, string> = {
  'first-touch': 'First Touch',
  'last-touch': 'Last Touch',
  'linear': 'Linear',
  'time-decay': 'Time Decay',
  'position-based': 'Position Based',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function AttributionModels({ dateRange }: AttributionModelsProps) {
  const { currentWorkspace } = useWorkspace();
  const [models, setModels] = useState<ModelComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AttributionModel>('last-touch');

  useEffect(() => {
    async function fetchAttributionData() {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch attribution paths with conversions (calls)
        const { data: paths, error: pathsError } = await supabase
          .from('attribution_paths')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .gte('updated_at', dateRange.from.toISOString())
          .lte('updated_at', dateRange.to.toISOString());

        if (pathsError) throw pathsError;

        // Fetch calls that have visitor_id to match with attribution paths
        const { data: calls, error: callsError } = await supabase
          .from('call_logs')
          .select('visitor_id, status')
          .eq('workspace_id', currentWorkspace.id)
          .eq('status', 'completed')
          .gte('call_started_at', dateRange.from.toISOString())
          .lte('call_started_at', dateRange.to.toISOString())
          .not('visitor_id', 'is', null);

        if (callsError) throw callsError;

        // Filter paths that resulted in conversions
        const conversionVisitorIds = new Set(
          (calls || []).map(c => c.visitor_id).filter(Boolean) as string[]
        );

        const conversionPaths = (paths || []).filter(p => 
          conversionVisitorIds.has(p.visitor_id)
        );

        // Calculate attribution for each model
        const modelTypes: AttributionModel[] = ['first-touch', 'last-touch', 'linear', 'time-decay', 'position-based'];
        const modelComparisons: ModelComparison[] = modelTypes.map(model => {
          const breakdown = aggregateAttributionWeights(conversionPaths, model);
          return {
            model,
            sourceBreakdown: breakdown,
            totalConversions: conversionPaths.length,
          };
        });

        setModels(modelComparisons);
      } catch (error) {
        console.error('Error fetching attribution data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttributionData();
  }, [currentWorkspace, dateRange]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
        <p className="text-muted-foreground mt-2">Loading attribution data...</p>
      </div>
    );
  }

  const selectedModelData = models.find(m => m.model === selectedModel);
  const chartData = selectedModelData
    ? Object.entries(selectedModelData.sourceBreakdown)
        .map(([source, value]) => ({
          source: source.split(':')[0] || source,
          medium: source.split(':')[1] || 'none',
          value: Math.round(value * 100) / 100,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  // Calculate model comparison metrics
  const getModelComparison = (model: AttributionModel) => {
    const modelData = models.find(m => m.model === model);
    if (!modelData) return null;

    const topSource = Object.entries(modelData.sourceBreakdown)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      topSource: topSource ? topSource[0].split(':')[0] : 'N/A',
      topSourceValue: topSource ? Math.round(topSource[1] * 100) / 100 : 0,
      totalSources: Object.keys(modelData.sourceBreakdown).length,
    };
  };

  return (
    <div className="space-y-6">
      {/* Model Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {models.map((model) => {
          const comparison = getModelComparison(model.model);
          if (!comparison) return null;

          return (
            <Card
              key={model.model}
              className={`cursor-pointer transition-all ${
                selectedModel === model.model
                  ? 'ring-2 ring-primary'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedModel(model.model)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {MODEL_LABELS[model.model]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold">{model.totalConversions}</p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Top Source</p>
                    <p className="text-sm font-medium truncate">{comparison.topSource}</p>
                    <p className="text-xs text-muted-foreground">
                      {comparison.topSourceValue} credits
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Model Details */}
      {selectedModelData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{MODEL_LABELS[selectedModel]} Attribution</CardTitle>
              <CardDescription>
                Source breakdown for {selectedModelData.totalConversions} conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="source"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#0088FE" name="Attribution Credits" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source Distribution</CardTitle>
              <CardDescription>
                Pie chart view of attribution credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Model Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Comparison</CardTitle>
          <CardDescription>
            Compare how different models attribute conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Source</th>
                  {models.map((model) => (
                    <th key={model.model} className="text-right p-2">
                      {MODEL_LABELS[model.model]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Get all unique sources across all models
                  const allSources = new Set<string>();
                  models.forEach(model => {
                    Object.keys(model.sourceBreakdown).forEach(source => {
                      allSources.add(source);
                    });
                  });

                  return Array.from(allSources).map((source) => {
                    const sourceLabel = source.split(':')[0] || source;
                    const values = models.map(model => 
                      model.sourceBreakdown[source] || 0
                    );
                    const maxValue = Math.max(...values);
                    const minValue = Math.min(...values.filter(v => v > 0));

                    return (
                      <tr key={source} className="border-b">
                        <td className="p-2 font-medium">{sourceLabel}</td>
                        {values.map((value, idx) => {
                          const isMax = value === maxValue && value > 0;
                          const isMin = value === minValue && value > 0 && maxValue !== minValue;
                          
                          return (
                            <td
                              key={idx}
                              className={`text-right p-2 ${
                                isMax ? 'text-green-600 font-semibold' : ''
                              } ${isMin ? 'text-red-600' : ''}`}
                            >
                              {value > 0 ? value.toFixed(2) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

