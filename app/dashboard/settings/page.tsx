'use client'

export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function DashboardSettingsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your workspace and account settings
          </p>
        </div>

        {/* Workspace Settings */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                defaultValue="Acme Corp"
                className="mt-1 max-w-md"
              />
            </div>
            <div>
              <Label htmlFor="workspace-url">Workspace URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">calltrack.io/</span>
                <Input
                  id="workspace-url"
                  defaultValue="acme-corp"
                  className="max-w-48"
                />
              </div>
            </div>
            <Button>Save changes</Button>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card className="border-border mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Billing</CardTitle>
              <Badge>Pro Plan</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-subtle">
              <div>
                <p className="font-medium">Pro Plan</p>
                <p className="text-sm text-muted-foreground">
                  $149/month · 5,000 calls included
                </p>
              </div>
              <Button variant="outline">Manage subscription</Button>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Usage this period</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-foreground w-3/4" />
                </div>
                <span className="text-sm font-medium">3,847 / 5,000 calls</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold">
                  G
                </div>
                <div>
                  <p className="font-medium">Google Ads</p>
                  <p className="text-sm text-muted-foreground">Import campaigns and sync conversions</p>
                </div>
              </div>
              <Button variant="outline">Connect</Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold">
                  S
                </div>
                <div>
                  <p className="font-medium">Stripe</p>
                  <p className="text-sm text-muted-foreground">Track revenue attribution</p>
                </div>
              </div>
              <Badge variant="outline">Coming soon</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete workspace</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace and all its data
                </p>
              </div>
              <Button variant="destructive">Delete</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

