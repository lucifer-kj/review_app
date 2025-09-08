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
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export function MasterSidebar({ collapsed = false, onToggle, searchTerm = "", onSearchChange }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Sync local search term with parent
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    onSearchChange?.(value);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        collapsed ? "w-16" : "w-64",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-4 py-4 border-b border-border">
            <Building2 className="h-6 w-6 text-primary" />
            {!collapsed && <span className="ml-2 text-xl font-bold">Crux</span>}
            <div className="ml-auto">
              <Button size="icon" variant="ghost" onClick={onToggle} aria-label="Toggle sidebar">
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {!collapsed && (
            <div className="px-4 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={localSearchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
                title={collapsed ? item.name : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {!collapsed && item.name}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Powered by Alpha Business Digital
            </p>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
