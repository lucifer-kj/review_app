import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  Star,
  Calendar
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTenantsList, useSuspendTenant, useActivateTenant } from '@/hooks/useSuperAdmin';
import type { TenantFilters, TenantStatus, PlanType } from '@/types/tenant.types';

export function TenantList() {
  const [filters, setFilters] = useState<TenantFilters>({
    search: '',
    status: undefined,
    plan_type: undefined,
    page: 1,
    limit: 20
  });

  const { data: tenantsData, isLoading, error } = useTenantsList(filters);
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();

  const tenants = tenantsData?.data?.tenants || [];
  const totalPages = tenantsData?.data?.total_pages || 0;
  const currentPage = tenantsData?.data?.page || 1;

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === 'all' ? undefined : status as TenantStatus,
      page: 1 
    }));
  };

  const handlePlanFilter = (plan: string) => {
    setFilters(prev => ({ 
      ...prev, 
      plan_type: plan === 'all' ? undefined : plan as PlanType,
      page: 1 
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSuspendTenant = async (tenantId: string) => {
    if (confirm('Are you sure you want to suspend this tenant?')) {
      await suspendTenant.mutateAsync(tenantId);
    }
  };

  const handleActivateTenant = async (tenantId: string) => {
    if (confirm('Are you sure you want to activate this tenant?')) {
      await activateTenant.mutateAsync(tenantId);
    }
  };

  const getStatusBadgeVariant = (status: TenantStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPlanBadgeVariant = (plan: PlanType) => {
    switch (plan) {
      case 'enterprise':
        return 'default';
      case 'pro':
        return 'secondary';
      case 'basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive">Error loading tenants: {error.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage organizations and their settings
          </p>
        </div>
        <Button asChild>
          <Link to="/master/tenants/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Tenant
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter tenants by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants by name or domain..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Plan Filter */}
            <Select value={filters.plan_type || 'all'} onValueChange={handlePlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants ({tenantsData?.data?.total || 0})</CardTitle>
          <CardDescription>
            List of all tenant organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : tenants.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {tenant.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(tenant.status)}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPlanBadgeVariant(tenant.plan_type)}>
                          {tenant.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tenant.domain ? (
                          <a 
                            href={`https://${tenant.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {tenant.domain}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No domain</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(tenant.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/master/tenants/${tenant.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/master/tenants/${tenant.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Tenant
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {tenant.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => handleSuspendTenant(tenant.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Suspend Tenant
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleActivateTenant(tenant.id)}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Activate Tenant
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tenants found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.status || filters.plan_type
                  ? 'Try adjusting your filters to see more results'
                  : 'Get started by creating your first tenant organization'
                }
              </p>
              {!filters.search && !filters.status && !filters.plan_type && (
                <Button asChild>
                  <Link to="/master/tenants/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tenant
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
