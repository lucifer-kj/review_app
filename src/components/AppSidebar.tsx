import { useState, useEffect } from "react";
import { FileText, BarChart3, Receipt, Settings, LogOut, Building2 } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Reviews", url: "/reviews", icon: FileText },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent text-accent-foreground shadow-sm" 
      : "hover:bg-accent/50 transition-colors duration-200";

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch {
      toast({
        title: "Error",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className="w-60 sm:w-64 border-r border-border/50 bg-sidebar/50 backdrop-blur-sm">
      <SidebarContent className="p-6">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-3 px-3 py-6 mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl shadow-sm">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground tracking-wide">Alpha Business</span>
              <span className="text-xs text-muted-foreground">Professional Solutions</span>
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${getNavCls}`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <div className="pt-6 mt-6 border-t border-border/50">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm">Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}