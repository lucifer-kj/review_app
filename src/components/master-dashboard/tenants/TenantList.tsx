import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, MoreHorizontal, Users, BarChart3, Eye, Edit, Ban, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MasterDashboardService } from "@/services/masterDashboardService";
import { TenantService } from "@/services/tenantService";
import { useMemo } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function TenantList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const queryClient = useQueryClient();

  const { data: tenantsResponse, isLoading, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => TenantService.getAllTenants(),
    refetchInterval: 30000,
  })
  // Enable real-time updates for tenant user counts
  useRealtimeUpdates({
    tables: [
      {
        table: 'profiles',
        queryKey: ['tenants'],
        events: ['INSERT', 'UPDATE', 'DELETE']
      }
    ],
    enabled: true,
    onError: (error) => {
      console.error('Real-time tenant updates error:', error);
    }
  });
;

  // Filter tenants based on search term
  const filteredTenants = useMemo(() => {
    if (!tenantsResponse?.data) return [];
    
    return tenantsResponse.data.filter(tenant =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tenantsResponse?.data, searchTerm]);

  // Paginate the filtered results
  const paginatedTenants = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTenants.slice(startIndex, endIndex);
  }, [filteredTenants, page, pageSize]);

  const data = {
    items: paginatedTenants,
    total: filteredTenants.length,
    page,
    pageSize,
  };

  // Fetch usage statistics for all tenants
  const tenantIds = paginatedTenants.map(t => t.id);
  const { data: usageStats } = useQuery({
    queryKey: ['tenant-usage-stats', tenantIds],
    queryFn: async () => {
      if (tenantIds.length === 0) return {};

      const stats: Record<string, { users_count: number; reviews_count: number }> = {};
      await Promise.all(
        tenantIds.map(async (tenantId) => {
          const result = await MasterDashboardService.getTenantUsageStats(tenantId);
          if (result.success && result.data) {
            stats[tenantId] = {
              users_count: result.data.users_count,
              reviews_count: result.data.reviews_count
            };
          } else {
            stats[tenantId] = { users_count: 0, reviews_count: 0 };
          }
        })
      );
      return stats;
    },
    enabled: tenantIds.length > 0,
    refetchInterval: 30000,
  });

  // Suspend tenant mutation
  const suspendTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const result = await TenantService.updateTenant(tenantId, { status: 'suspended' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to suspend tenant');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Tenant suspended successfully");
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to suspend tenant");
    },
  });

  // Activate tenant mutation
  const activateTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const result = await TenantService.updateTenant(tenantId, { status: 'active' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to activate tenant');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Tenant activated successfully");
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate tenant");
    },
  });

  if (isLoading) {
    return (
      <AppErrorBoundary componentName="TenantList">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Tenant Management</h2>
              <p className="text-muted-foreground">
                Manage tenant organizations and their settings
              </p>
            </div>
          </div>
          
          {/* Search and Actions Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>

          {/* Tenants Grid Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppErrorBoundary>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tenant Management</h2>
            <p className="text-muted-foreground">
              Manage tenant organizations and their settings
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load tenants. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AppErrorBoundary componentName="TenantList">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenant Management</h2>
          <p className="text-muted-foreground">
            Manage tenant organizations and their settings
          </p>
        </div>
        <Button asChild>
          <Link to="/master/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tenants Grid */}
      {paginatedTenants.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tenant Organizations</CardTitle>
            <CardDescription>
              View and manage all tenant organizations on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchTerm ? "No tenants found" : "No tenants yet"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search terms."
                  : "Get started by creating your first tenant organization."
                }
              </p>
              {!searchTerm && (
                <Button asChild className="mt-4">
                  <Link to="/master/tenants/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Tenant
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedTenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/master/tenants/${tenant.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/master/tenants/${tenant.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {tenant.status === 'active' ? (
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => suspendTenantMutation.mutate(tenant.id)}
                          disabled={suspendTenantMutation.isPending}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend Tenant
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          className="text-green-600"
                          onClick={() => activateTenantMutation.mutate(tenant.id)}
                          disabled={activateTenantMutation.isPending}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Activate Tenant
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  {tenant.domain && (
                    <div className="text-sm text-muted-foreground">
                      Domain: {tenant.domain}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={tenant.status === 'active' ? 'default' : 'secondary'}
                    >
                      {tenant.status}
                    </Badge>
                    {/* Plan badge hidden until available */}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{usageStats?.[tenant.id]?.users_count ?? 0} users</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{usageStats?.[tenant.id]?.reviews_count ?? 0} reviews</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(tenant.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {Math.max(1, Math.ceil(data.total / pageSize))}
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= data.total}>
            Next
          </Button>
        </div>
      </div>
      </div>
    </AppErrorBoundary>
  );
}
