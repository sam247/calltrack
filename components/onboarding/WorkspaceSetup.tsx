'use client'

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";

interface WorkspaceSetupProps {
  onComplete: () => void;
  onNext: () => void;
}

export function WorkspaceSetup({ onComplete, onNext }: WorkspaceSetupProps) {
  const { createWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workspace name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createWorkspace(name);
      toast({
        title: "Success",
        description: "Workspace created successfully",
      });
      onComplete();
      onNext();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create workspace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="workspace-name">Workspace Name</Label>
        <Input
          id="workspace-name"
          placeholder="My Company"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <p className="text-sm text-muted-foreground">
          This is the name of your organization or business
        </p>
      </div>

      <Button type="submit" disabled={loading || !name.trim()}>
        {loading ? "Creating..." : "Create Workspace"}
      </Button>
    </form>
  );
}

