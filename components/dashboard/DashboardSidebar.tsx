'use client'

import { BarChart3, Phone, Settings, LogOut, FileText, Globe, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const menuItems = [
  { title: "Overview", url: "/dashboard", icon: BarChart3 },
  { title: "Call Log", url: "/dashboard/calls", icon: Phone },
  { title: "Tracking Numbers", url: "/dashboard/tracking-numbers", icon: Phone },
  { title: "Attribution", url: "/dashboard/attribution", icon: TrendingUp },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "SEO Sources", url: "/dashboard/seo", icon: Globe },
  { title: "Reports", url: "/dashboard/reports", icon: FileText },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    router.push("/");
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      href={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      activeClassName="bg-accent text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="mb-2 px-3">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
