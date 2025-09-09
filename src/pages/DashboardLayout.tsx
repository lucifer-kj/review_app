import { Outlet } from "react-router-dom";
import { Building2, LogOut, Settings, User, ChevronDown } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileHeader } from "@/components/MobileHeader";

const ShareButton = lazy(() => import("@/components/ShareButton").then(module => ({ default: module.ShareButton })));
const CopyLinkButton = lazy(() => import("@/components/CopyLinkButton").then(module => ({ default: module.CopyLinkButton })));

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Mobile Header */}
      <MobileHeader onLogout={handleLogout} />
      
      {/* Desktop Header */}
      <header className="hidden lg:flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-base">Crux</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<LoadingSpinner />}>
            <CopyLinkButton tenantId={user?.tenant_id} />
          </Suspense>
          <Suspense fallback={<LoadingSpinner />}>
            <ShareButton tenantId={user?.tenant_id} />
          </Suspense>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    AB
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">Account</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        <div className="flex-1 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;