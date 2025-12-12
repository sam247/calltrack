'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  loading: boolean;
  createWorkspace: (name: string) => Promise<{ data: Workspace | null; error: Error | null }>;
  refetchWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from("workspace_members")
      .select(`
        role,
        workspace:workspaces (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching workspaces:", error);
      setLoading(false);
      return;
    }

    const formattedWorkspaces: Workspace[] = (data || []).map((item: any) => ({
      id: item.workspace.id,
      name: item.workspace.name,
      slug: item.workspace.slug,
      logo_url: item.workspace.logo_url,
      role: item.role,
    }));

    setWorkspaces(formattedWorkspaces);
    
    // Set current workspace from localStorage or first one (client-side only)
    if (typeof window !== 'undefined') {
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
      const savedWorkspace = formattedWorkspaces.find(w => w.id === savedWorkspaceId);
      
      if (savedWorkspace) {
        setCurrentWorkspace(savedWorkspace);
      } else if (formattedWorkspaces.length > 0) {
        setCurrentWorkspace(formattedWorkspaces[0]);
        localStorage.setItem("currentWorkspaceId", formattedWorkspaces[0].id);
      }
    } else if (formattedWorkspaces.length > 0) {
      setCurrentWorkspace(formattedWorkspaces[0]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const handleSetCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    if (typeof window !== 'undefined') {
      localStorage.setItem("currentWorkspaceId", workspace.id);
    }
  };

  const createWorkspace = async (name: string): Promise<{ data: Workspace | null; error: Error | null }> => {
    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    // Create the workspace
    const { data: workspace, error: wsError } = await (supabase
      .from("workspaces") as any)
      .insert({ name, slug })
      .select()
      .single();

    if (wsError) {
      return { data: null, error: wsError as Error };
    }

    // Add user as owner
    const { error: memberError } = await (supabase
      .from("workspace_members") as any)
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      return { data: null, error: memberError as Error };
    }

    const newWorkspace: Workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logo_url: workspace.logo_url,
      role: "owner",
    };

    setWorkspaces(prev => [...prev, newWorkspace]);
    setCurrentWorkspace(newWorkspace);
    if (typeof window !== 'undefined') {
      localStorage.setItem("currentWorkspaceId", newWorkspace.id);
    }

    return { data: newWorkspace, error: null };
  };

  return (
    <WorkspaceContext.Provider 
      value={{ 
        workspaces, 
        currentWorkspace, 
        setCurrentWorkspace: handleSetCurrentWorkspace, 
        loading,
        createWorkspace,
        refetchWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
