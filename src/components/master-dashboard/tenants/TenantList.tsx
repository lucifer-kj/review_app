import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, MoreHorizontal, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MasterDashboardService } from "@/services/masterDashboardService";
import { useMemo } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TenantList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants', { searchTerm, page, pageSize }],
    queryFn: () => MasterDashboardService.getTenantList({
      search: searchTerm || undefined,
      status: 'all',
      page,
      pageSize,
    }),
    keepPreviousData: true,
    refetchInterval: 30000,
  });

  // Fetch usage statistics for all tenants
  const tenantIds = data?.items?.map(t => t.id) ?? [];
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

  const filteredTenants = data?.items ?? [];

  if (isLoading) {
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
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
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
      {filteredTenants.length === 0 ? (
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
          {filteredTenants.map((tenant) => (
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
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/master/tenants/${tenant.id}/edit`}>
                          Edit Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Suspend Tenant
                      </DropdownMenuItem>
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
          Page {data?.page ?? 1} of {data ? Math.max(1, Math.ceil(data.total / (data.pageSize || pageSize))) : 1}
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={(data?.page ?? 1) <= 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data ? (data.page * data.pageSize) >= data.total : true}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
