import { LogOut, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBreakpoint } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function MasterHeader() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isTestUser, isBypassUser } = useAuth();
  const { isMobile, isTablet } = useBreakpoint();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = () => {
    if (isTestUser) return "Test User";
    if (isBypassUser) return "Bypass User";
    return user?.email || "Super Admin";
  };

  const getUserRole = () => {
    if (isTestUser) return "Test Account";
    if (isBypassUser) return "Bypass Account";
    return "Super Administrator";
  };

  return (
    <header className={cn(
      "bg-background border-b border-border",
      // Mobile: smaller padding
      isMobile ? "px-3 py-3" :
      // Tablet: medium padding
      isTablet ? "px-4 py-4" :
      // Desktop: full padding
      "px-6 py-4"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className={cn(
            "font-bold",
            // Mobile: smaller text
            isMobile ? "text-lg" :
            // Tablet: medium text
            isTablet ? "text-xl" :
            // Desktop: full text
            "text-2xl"
          )}>
            {isMobile ? "Master" : "Master Dashboard"}
          </h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications - hide on very small screens */}
          {!isMobile && (
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(
                "relative rounded-full",
                // Mobile: smaller avatar
                isMobile ? "h-8 w-8" : "h-8 w-8"
              )}>
                <Avatar className={cn(
                  // Mobile: smaller avatar
                  isMobile ? "h-8 w-8" : "h-8 w-8"
                )}>
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn(
              "align-end forceMount",
              // Mobile: smaller width
              isMobile ? "w-48" : "w-56"
            )} align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className={cn(
                  "font-medium leading-none",
                  // Mobile: smaller text
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {getUserDisplayName()}
                </p>
                <p className={cn(
                  "leading-none text-muted-foreground",
                  // Mobile: smaller text
                  isMobile ? "text-xs" : "text-xs"
                )}>
                  {getUserRole()}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
