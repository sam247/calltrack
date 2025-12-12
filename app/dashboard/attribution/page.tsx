'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AttributionModels } from "@/components/dashboard/AttributionModels";
import { AttributionBreakdown } from "@/components/dashboard/AttributionBreakdown";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AttributionPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Attribution Analysis</h1>
            <p className="text-muted-foreground">
              Compare attribution models and analyze conversion paths
            </p>
          </div>
          <DateFilter onDateChange={setDateRange} />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="models" className="space-y-6">
          <TabsList>
            <TabsTrigger value="models">Model Comparison</TabsTrigger>
            <TabsTrigger value="breakdown">Source Breakdown</TabsTrigger>
            <TabsTrigger value="paths">Conversion Paths</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-6">
            <AttributionModels dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <AttributionBreakdown dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="paths" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Paths</CardTitle>
                <CardDescription>
                  View detailed attribution paths for each conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Conversion path details coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

