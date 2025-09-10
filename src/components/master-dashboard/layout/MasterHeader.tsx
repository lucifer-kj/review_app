import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function MasterHeader({ onMobileMenuToggle, mobileMenuOpen }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const { isMobile, isTablet } = useBreakpoint();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      // Mobile: minimal padding
      isMobile ? "px-3 py-2" :
      // Tablet: medium padding
      isTablet ? "px-4 py-3" :
      // Desktop: full padding
      "px-6 py-4"
    )}>
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu + Search */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {/* Search - responsive design */}
          <div className={cn(
            "relative flex-1 max-w-md",
            // Mobile: full width
            isMobile ? "max-w-none" :
            // Tablet: medium width
            isTablet ? "max-w-sm" :
            // Desktop: full width
            "max-w-md"
          )}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={isMobile ? "Search..." : "Search tenants, users..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10",
                // Mobile: smaller input
                isMobile ? "h-9" : "h-10"
              )}
            />
          </div>
        </div>

        {/* Right side - Notifications + User menu */}
        <div className="flex items-center space-x-2">
          {/* Notifications - hide on mobile */}
          {!isMobile && (
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                3
              </Badge>
            </Button>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(
                "relative h-8 w-8 rounded-full",
                // Mobile: smaller button
                isMobile ? "h-8 w-8" : "h-10 w-10"
              )}>
                <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Super Admin</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Platform Administrator
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
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