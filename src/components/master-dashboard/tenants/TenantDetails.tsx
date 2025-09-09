import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  BarChart3, 
  Calendar, 
  Mail, 
  Globe,
  Edit,
  ArrowLeft,
  Activity,
  Database,
  Settings
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MasterDashboardService } from "@/services/masterDashboardService";
import { TenantService } from "@/services/tenantService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TenantDetails() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch tenant details
  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant-details', tenantId],
    queryFn: () => MasterDashboardService.getTenantDetails(tenantId!),
    enabled: !!tenantId,
  });

  // Fetch tenant usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['tenant-usage-stats', tenantId],
    queryFn: () => MasterDashboardService.getTenantUsageStats(tenantId!),
    enabled: !!tenantId,
  });

  // Fetch tenant users
  const { data: tenantUsers } = useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: () => MasterDashboardService.getTenantUsers(tenantId!),
    enabled: !!tenantId,
  });

  // Suspend tenant mutation
  const suspendTenantMutation = useMutation({
    mutationFn: async () => {
      const result = await TenantService.updateTenant(tenantId!, { status: 'suspended' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to suspend tenant');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Tenant suspended successfully");
      queryClient.invalidateQueries({ queryKey: ['tenant-details', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to suspend tenant");
    },
  });

  // Activate tenant mutation
  const activateTenantMutation = useMutation({
    mutationFn: async () => {
      const result = await TenantService.updateTenant(tenantId!, { status: 'active' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to activate tenant');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Tenant activated successfully");
      queryClient.invalidateQueries({ queryKey: ['tenant-details', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate tenant");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/master/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenants
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tenant Details</h2>
            <p className="text-muted-foreground">Loading tenant information...</p>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/master/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenants
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tenant Details</h2>
            <p className="text-muted-foreground">Failed to load tenant information</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load tenant details. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = usageStats?.data || {
    users_count: 0,
    reviews_count: 0,
    storage_used: 0,
    api_calls_count: 0,
    last_activity: null
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/master/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{tenant.name}</h2>
            <p className="text-muted-foreground">Tenant organization details and management</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link to={`/master/users/invite?tenantId=${tenantId}`}>
              <Mail className="mr-2 h-4 w-4" />
              Invite User
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/master/tenants/${tenantId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Settings
            </Link>
          </Button>
          {tenant.status === 'active' ? (
            <Button 
              variant="destructive" 
              onClick={() => suspendTenantMutation.mutate()}
              disabled={suspendTenantMutation.isPending}
            >
              Suspend Tenant
            </Button>
          ) : (
            <Button 
              onClick={() => activateTenantMutation.mutate()}
              disabled={activateTenantMutation.isPending}
            >
              Activate Tenant
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reviews</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reviews_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.storage_used ? `${(stats.storage_used / 1024 / 1024).toFixed(1)} MB` : '0 MB'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tenant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Tenant Information</span>
            </CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
              <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                  <p className="text-sm">{tenant.name}</p>
              </div>
                {tenant.domain && (
              <div>
                    <label className="text-sm font-medium text-muted-foreground">Domain</label>
                    <p className="text-sm flex items-center space-x-1">
                      <Globe className="h-3 w-3" />
                      <span>{tenant.domain}</span>
                    </p>
                </div>
                )}
              <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(tenant.created_at).toLocaleDateString()}</span>
                  </p>
              </div>
                {stats.last_activity && (
              <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                    <p className="text-sm flex items-center space-x-1">
                      <Activity className="h-3 w-3" />
                      <span>{new Date(stats.last_activity).toLocaleDateString()}</span>
                </p>
              </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Tenant Users ({tenantUsers?.length || 0})</span>
                  </CardTitle>
                  <CardDescription>
                    Users associated with this tenant organization
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link to={`/master/users/invite?tenantId=${tenantId}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Invite User
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tenantUsers && tenantUsers.length > 0 ? (
                <div className="space-y-2">
                  {tenantUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                          <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No users yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Users will appear here once they are invited to this tenant.
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
                <span>Usage Analytics</span>
            </CardTitle>
            <CardDescription>
                Detailed usage statistics for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Total Users</label>
                  <p className="text-2xl font-bold">{stats.users_count}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Total Reviews</label>
                  <p className="text-2xl font-bold">{stats.reviews_count}</p>
              </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">API Calls</label>
                  <p className="text-2xl font-bold">{stats.api_calls_count}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Storage Used</label>
                  <p className="text-2xl font-bold">
                    {stats.storage_used ? `${(stats.storage_used / 1024 / 1024).toFixed(1)} MB` : '0 MB'}
                  </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
      <Card>
        <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Tenant Settings</span>
              </CardTitle>
          <CardDescription>
                Configuration and settings for this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Plan Type</label>
                  <p className="text-sm">{tenant.plan_type || 'Basic'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Billing Email</label>
                  <p className="text-sm">{tenant.billing_email || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Settings</label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(tenant.settings || {}, null, 2)}
                  </pre>
                </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
