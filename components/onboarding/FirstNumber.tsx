'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface FirstNumberProps {
  onComplete: () => void;
  onNext: () => void;
}

export function FirstNumber({ onComplete, onNext }: FirstNumberProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const router = useRouter();
  const [forwardingNumber, setForwardingNumber] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProvision = async () => {
    if (!forwardingNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a forwarding number",
        variant: "destructive",
      });
      return;
    }

    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tracking-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          forwarding_number: forwardingNumber,
          label: label || 'Main Number',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to provision number');
      }

      toast({
        title: "Success",
        description: "Tracking number provisioned successfully",
      });
      onComplete();
      onNext();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to provision tracking number",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Provision Your First Tracking Number</h3>
          <p className="text-sm text-muted-foreground">
            Set up a tracking number that will forward calls to your business phone
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tracking Number Setup</CardTitle>
            <CardDescription className="text-xs">
              We'll provision a phone number and forward calls to your number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (Optional)</Label>
              <Input
                id="label"
                placeholder="Main Number"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forwarding">Forwarding Number *</Label>
              <Input
                id="forwarding"
                type="tel"
                placeholder="+1234567890"
                value={forwardingNumber}
                onChange={(e) => setForwardingNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The phone number where calls should be forwarded (E.164 format: +1234567890)
              </p>
            </div>

            <Button
              onClick={handleProvision}
              disabled={loading || !forwardingNumber.trim()}
              className="w-full"
            >
              {loading ? "Provisioning..." : "Provision Tracking Number"}
            </Button>
          </CardContent>
        </Card>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> After provisioning, you can add this tracking number to your website,
            marketing materials, or ads to start tracking which sources generate calls.
          </p>
        </div>
      </div>
    </div>
  );
}

