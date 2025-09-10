import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Server, 
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  email_service: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
}

interface SystemSettings {
  maintenance_mode: boolean;
  email_notifications: boolean;
  auto_backup: boolean;
  debug_mode: boolean;
  rate_limiting: boolean;
}

export default function SystemAdministration() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system status
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: async (): Promise<SystemStatus> => {
      // Simulate system health checks
      const checks = await Promise.allSettled([
        // Database health check
        supabase.from('tenants').select('count', { count: 'exact', head: true }),
        // Email service check (simulated)
        Promise.resolve({ success: true }),
        // Storage check (simulated)
        Promise.resolve({ success: true }),
        // API health check
        supabase.auth.getSession(),
      ]);

      return {
        database: checks[0].status === 'fulfilled' ? 'healthy' : 'error',
        email_service: checks[1].status === 'fulfilled' ? 'healthy' : 'error',
        storage: checks[2].status === 'fulfilled' ? 'healthy' : 'error',
        api: checks[3].status === 'fulfilled' ? 'healthy' : 'error',
      };
    },
    refetchInterval: 30000,
  });

  // Fetch system settings
  const { data: systemSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async (): Promise<SystemSettings> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        maintenance_mode: data?.maintenance_mode || false,
        email_notifications: data?.email_notifications || true,
        auto_backup: data?.auto_backup || true,
        debug_mode: data?.debug_mode || false,
        rate_limiting: data?.rate_limiting || true,
      };
    },
  });

  // Update system settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<SystemSettings>) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 'global',
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: "Settings Updated",
        description: "System settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update system settings.",
        variant: "destructive",
      });
    },
  });

  // Refresh system status
  const refreshStatus = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['system-status'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadgeVariant = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
    }
  };

  if (statusLoading || settingsLoading) {
    return (
      <AppErrorBoundary componentName="SystemAdministration">
        <div className={cn(
            "space-y-4 sm:space-y-6",
            // Mobile: smaller spacing
            "space-y-4",
            // Tablet: medium spacing
            "sm:space-y-5",
            // Desktop: full spacing
            "lg:space-y-6"
          )}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">System Administration</h2>
              <p className="text-muted-foreground">
                Monitor and manage platform systems
              </p>
            </div>
          </div>
          
          {/* System Status Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary componentName="SystemAdministration">
      <div className={cn(
            "space-y-4 sm:space-y-6",
            // Mobile: smaller spacing
            "space-y-4",
            // Tablet: medium spacing
            "sm:space-y-5",
            // Desktop: full spacing
            "lg:space-y-6"
          )}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Administration</h2>
          <p className="text-muted-foreground">
            Monitor and manage platform systems
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshStatus}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            {systemStatus && getStatusIcon(systemStatus.database)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <Badge variant={systemStatus ? getStatusBadgeVariant(systemStatus.database) : 'outline'}>
                {systemStatus?.database || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Service</CardTitle>
            {systemStatus && getStatusIcon(systemStatus.email_service)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Badge variant={systemStatus ? getStatusBadgeVariant(systemStatus.email_service) : 'outline'}>
                {systemStatus?.email_service || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            {systemStatus && getStatusIcon(systemStatus.storage)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <Badge variant={systemStatus ? getStatusBadgeVariant(systemStatus.storage) : 'outline'}>
                {systemStatus?.storage || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API</CardTitle>
            {systemStatus && getStatusIcon(systemStatus.api)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <Badge variant={systemStatus ? getStatusBadgeVariant(systemStatus.api) : 'outline'}>
                {systemStatus?.api || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>System Settings</span>
          </CardTitle>
          <CardDescription>
            Configure platform-wide settings and features
          </CardDescription>
        </CardHeader>
        <CardContent className={cn(
            "space-y-4 sm:space-y-6",
            // Mobile: smaller spacing
            "space-y-4",
            // Tablet: medium spacing
            "sm:space-y-5",
            // Desktop: full spacing
            "lg:space-y-6"
          )}>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable platform access for maintenance
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={systemSettings?.maintenance_mode || false}
              onCheckedChange={(checked) => 
                updateSettingsMutation.mutate({ maintenance_mode: checked })
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable system-wide email notifications
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={systemSettings?.email_notifications || true}
              onCheckedChange={(checked) => 
                updateSettingsMutation.mutate({ email_notifications: checked })
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-backup">Auto Backup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup data on a schedule
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={systemSettings?.auto_backup || true}
              onCheckedChange={(checked) => 
                updateSettingsMutation.mutate({ auto_backup: checked })
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="debug-mode">Debug Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable detailed logging and debugging information
              </p>
            </div>
            <Switch
              id="debug-mode"
              checked={systemSettings?.debug_mode || false}
              onCheckedChange={(checked) => 
                updateSettingsMutation.mutate({ debug_mode: checked })
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rate-limiting">Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">
                Enable API rate limiting to prevent abuse
              </p>
            </div>
            <Switch
              id="rate-limiting"
              checked={systemSettings?.rate_limiting || true}
              onCheckedChange={(checked) => 
                updateSettingsMutation.mutate({ rate_limiting: checked })
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Management</span>
            </CardTitle>
            <CardDescription>
              Database maintenance and optimization tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Activity className="mr-2 h-4 w-4" />
              Run Database Optimization
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HardDrive className="mr-2 h-4 w-4" />
              Clean Up Old Data
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Statistics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security & Monitoring</span>
            </CardTitle>
            <CardDescription>
              Security tools and monitoring utilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Shield className="mr-2 h-4 w-4" />
              Security Audit
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Activity className="mr-2 h-4 w-4" />
              View System Logs
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Performance Metrics
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </AppErrorBoundary>
  );
}
