'use client'

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CallLogTable } from "@/components/dashboard/CallLogTable";
import { SEOSourceReport } from "@/components/dashboard/SEOSourceReport";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  
  const { workspaces, currentWorkspace, createWorkspace, loading } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateFirstWorkspace = async () => {
    if (!workspaceName.trim()) return;
    
    setIsCreating(true);
    const { error } = await createWorkspace(workspaceName);
    
    if (error) {
      toast({
        title: "Error creating workspace",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Workspace created!",
        description: "You're all set to start tracking calls.",
      });
    }
    
    setIsCreating(false);
  };

  // Show onboarding if no workspaces
  if (!loading && workspaces.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground text-background mx-auto mb-6">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Create your first workspace</h1>
          <p className="text-muted-foreground mb-8">
            Workspaces help you organize call tracking for different businesses or campaigns.
          </p>
          
          <div className="text-left space-y-4">
            <div>
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Company"
                className="mt-2"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleCreateFirstWorkspace}
              disabled={isCreating || !workspaceName.trim()}
            >
              {isCreating ? "Creating..." : "Create workspace"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Track and analyze your inbound calls
            </p>
          </div>
          <DateFilter onDateChange={setDateRange} />
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsCards />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call Log */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Recent Calls</h2>
              <p className="text-sm text-muted-foreground">
                Latest inbound calls with attribution data
              </p>
            </div>
            <CallLogTable />
          </div>

          {/* SEO Report */}
          <div className="lg:col-span-1">
            <SEOSourceReport />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

