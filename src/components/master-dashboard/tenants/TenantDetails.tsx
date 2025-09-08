import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Users, BarChart3, Calendar, Globe, Settings, UserCheck, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MasterDashboardService } from "@/services/masterDashboardService";
import { TenantService } from "@/services/tenantService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TenantDetails() {
  const { tenantId } = useParams();

  // Fetch tenant details
  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const result = await TenantService.getTenantById(tenantId!);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tenant');
      }
      return result.data!;
    },
    enabled: !!tenantId,
  });

  // Fetch usage statistics
  const { data: usageStats, isLoading: statsLoading } = useQuery({
    queryKey: ['tenant-usage-stats', tenantId],
    queryFn: async () => {
      const result = await MasterDashboardService.getTenantUsageStats(tenantId!);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch usage stats');
      }
      return result.data!;
    },
    enabled: !!tenantId,
  });

  if (tenantLoading || statsLoading) {
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

  if (tenantError || !tenant) {
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
            <p className="text-muted-foreground">Error loading tenant</p>
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
          <h2 className="text-3xl font-bold tracking-tight">{tenant.name}</h2>
          <p className="text-muted-foreground">
            Tenant ID: {tenant.id}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Tenant Information</span>
            </CardTitle>
            <CardDescription>
              Basic tenant organization details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Organization Name</label>
                <p className="text-sm text-muted-foreground">{tenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">
                  <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                    {tenant.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Domain</label>
                <p className="text-sm text-muted-foreground">{tenant.domain || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Review Form URL</label>
                <p className="text-sm text-muted-foreground break-all">
                  {tenant.review_form_url || 'Not generated'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Usage Statistics</span>
            </CardTitle>
            <CardDescription>
              Tenant usage and activity metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Users</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageStats?.users_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Reviews</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageStats?.reviews_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Last Activity</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageStats?.last_activity 
                    ? new Date(usageStats.last_activity).toLocaleDateString()
                    : 'No activity'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Actions</CardTitle>
          <CardDescription>
            Manage this tenant organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to={`/master/tenants/${tenant.id}/edit`}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Settings
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/master/users">
                <UserCheck className="mr-2 h-4 w-4" />
                View Users
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/master/audit">
                <FileText className="mr-2 h-4 w-4" />
                View Logs
              </Link>
            </Button>
            <Button 
              variant={tenant.status === 'active' ? 'destructive' : 'default'}
              onClick={() => {
                // TODO: Implement suspend/activate functionality
                console.log('Toggle tenant status:', tenant.id);
              }}
            >
              {tenant.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
