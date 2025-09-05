import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Shield,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/master', icon: LayoutDashboard },
  { name: 'Tenants', href: '/master/tenants', icon: Building2 },
  { name: 'Users', href: '/master/users', icon: Users },
  { name: 'System', href: '/master/system', icon: Settings },
  { name: 'Analytics', href: '/master/analytics', icon: BarChart3 },
  { name: 'Audit Logs', href: '/master/audit', icon: Shield },
];

export function MasterSidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          {mobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Crux</h1>
                <p className="text-xs text-muted-foreground">Powered by Alpha Business Digital</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    "group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">
              <p>Super Admin Access</p>
              <p>Platform Management</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
