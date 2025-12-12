'use client'

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, BarChart3 } from "lucide-react";

const reports = [
  {
    id: "1",
    name: "Monthly Call Summary",
    description: "Overview of all calls, sources, and conversions",
    lastGenerated: "Jan 1, 2024",
    icon: BarChart3,
  },
  {
    id: "2",
    name: "Campaign Attribution",
    description: "Detailed breakdown by campaign and ad group",
    lastGenerated: "Jan 1, 2024",
    icon: FileText,
  },
  {
    id: "3",
    name: "SEO Performance",
    description: "Organic landing page call attribution",
    lastGenerated: "Jan 1, 2024",
    icon: FileText,
  },
  {
    id: "4",
    name: "Weekly Digest",
    description: "Week-over-week performance comparison",
    lastGenerated: "Jan 8, 2024",
    icon: Calendar,
  },
];

export default function DashboardReportsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">
              Generate and download call tracking reports
            </p>
          </div>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
                      <report.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last generated: {report.lastGenerated}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

