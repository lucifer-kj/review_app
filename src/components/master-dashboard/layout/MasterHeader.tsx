import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Shield,
  Activity
} from 'lucide-react';
import { useTenantContext } from '@/hooks/useTenantContext';
import { usePlatformAnalytics } from '@/hooks/useSuperAdmin';
import { supabase } from '@/integrations/supabase/client';

export function MasterHeader() {
  const { isSuperAdmin } = useTenantContext();
  const { data: analytics } = usePlatformAnalytics();
  const navigate = useNavigate();
  const [notifications] = useState([
    { id: 1, message: 'New tenant registered', time: '2 minutes ago', type: 'info' },
    { id: 2, message: 'System backup completed', time: '1 hour ago', type: 'success' },
    { id: 3, message: 'High usage detected', time: '3 hours ago', type: 'warning' },
  ]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      // Handle logout error silently or show toast
      navigate('/login'); // Force redirect even if signOut fails
    }
  };

  return (
    <header className="bg-background border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Title and status */}
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Master Dashboard
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
                {analytics?.data && (
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    {analytics.data.active_tenants} Active Tenants
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex-col items-start">
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-medium">{notification.message}</span>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                {notifications.length === 0 && (
                  <DropdownMenuItem disabled>
                    <span className="text-sm text-muted-foreground">No notifications</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/super-admin.png" alt="Super Admin" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
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
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
