'use client'

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { SEOSourceReport } from "@/components/dashboard/SEOSourceReport";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, TrendingUp, Target } from "lucide-react";

export default function DashboardSEOPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">SEO Sources</h1>
            <p className="text-muted-foreground">
              Organic search performance and landing page attribution
            </p>
          </div>
          <DateFilter onDateChange={setDateRange} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Organic Calls</span>
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">3,050</span>
                <span className="text-sm font-medium text-success">+18%</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Top Performing Page</span>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold">/services/plumbing</span>
                <p className="text-sm text-muted-foreground">847 calls</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Avg Conversion Rate</span>
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">34.3%</span>
                <span className="text-sm font-medium text-success">+4.2%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Report */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SEOSourceReport />
          <SEOSourceReport />
        </div>
      </div>
    </DashboardLayout>
  );
}

