import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  User
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-mobile";

const navigation = [
  { name: "Overview", href: "/master", icon: LayoutDashboard },
  { name: "Tenants", href: "/master/tenants", icon: Building2 },
  { name: "Users", href: "/master/users", icon: Users },
  { name: "System", href: "/master/system", icon: Settings },
  { name: "Audit Logs", href: "/master/audit", icon: Shield },
];

interface Props { 
  collapsed?: boolean; 
  onToggle?: () => void;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export function MasterSidebar({ 
  collapsed = false, 
  onToggle, 
  mobileMenuOpen = false,
  onMobileMenuToggle,
  searchTerm = "", 
  onSearchChange 
}: Props) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Sync local search term with parent
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Close mobile menu when screen size changes
  useEffect(() => {
    if (!isMobile && mobileMenuOpen && onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  }, [isMobile, mobileMenuOpen, onMobileMenuToggle]);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    onSearchChange?.(value);
  };

  const sidebarContent = (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border",
      // Mobile: full height with overlay
      isMobile ? "w-80" :
      // Tablet: responsive width
      isTablet ? (collapsed ? "w-16" : "w-64") :
      // Desktop: responsive width
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b border-border",
        // Mobile: always show full header
        isMobile ? "p-4" :
        // Tablet/Desktop: responsive padding
        collapsed ? "p-2" : "p-4"
      )}>
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Crux Admin</span>
          </div>
        )}
        
        {/* Mobile menu toggle */}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="ml-auto"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
        
        {/* Desktop collapse toggle */}
        {!isMobile && onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Search - only show on larger screens when not collapsed */}
      {!isMobile && !collapsed && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search..."
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                // Mobile: full width with proper spacing
                isMobile ? "w-full" :
                // Tablet/Desktop: responsive width
                collapsed ? "justify-center px-2" : "w-full",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => {
                // Close mobile menu when navigating
                if (isMobile && onMobileMenuToggle) {
                  onMobileMenuToggle();
                }
              }}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                // Mobile: normal size
                isMobile ? "w-5 h-5" :
                // Tablet/Desktop: responsive size
                collapsed ? "w-4 h-4" : "w-5 h-5"
              )} />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t border-border",
        // Mobile: full padding
        isMobile ? "p-4" :
        // Tablet/Desktop: responsive padding
        collapsed ? "p-2" : "p-4"
      )}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Super Admin</p>
              <p className="text-xs text-muted-foreground truncate">Platform Administrator</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      {isMobile && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="fixed inset-y-0 left-0 z-30">
          {sidebarContent}
        </div>
      )}
    </>
  );
}