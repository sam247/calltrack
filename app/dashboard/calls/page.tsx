'use client'

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { RealtimeCallLog } from "@/components/dashboard/RealtimeCallLog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function DashboardCallsPage() {
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
            <h1 className="text-2xl font-bold">Call Log</h1>
            <p className="text-muted-foreground">
              Complete history of all tracked calls
            </p>
          </div>
          <DateFilter onDateChange={setDateRange} />
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone number, source, or campaign..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <RealtimeCallLog />
      </div>
    </DashboardLayout>
  );
}

