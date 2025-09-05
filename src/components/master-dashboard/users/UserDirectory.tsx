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
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Mail,
  Calendar,
  Building2,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { UserInvitationService } from '@/services/userInvitationService';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface UserFilters {
  search: string;
  role: string;
  status: string;
}

export function UserDirectory() {
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all'
  });

  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['users', page, limit, filters],
    queryFn: () => UserInvitationService.getAllUsers(page, limit, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const users = usersData?.data?.users || [];
  const totalPages = usersData?.data?.total_pages || 0;
  const totalUsers = usersData?.data?.total || 0;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default' as const;
      case 'tenant_admin':
        return 'secondary' as const;
      case 'user':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Users</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the user directory
          </p>
          <Button onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Directory</h1>
          <p className="text-muted-foreground">
            Manage all users across the platform ({totalUsers} users)
          </p>
        </div>
        <Button asChild>
          <Link to="/master/users/invite">
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter users by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or tenant..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({totalUsers})</CardTitle>
          <CardDescription>
            All platform users and their details
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
          ) : users.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{user.id}</div>
                            <div className="text-sm text-muted-foreground">
                              User ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {formatRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {user.tenant ? (
                            <Link 
                              to={`/master/tenants/${user.tenant.id}`}
                              className="text-primary hover:underline"
                            >
                              {user.tenant.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">No Tenant</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(user.created_at).toLocaleDateString()}</span>
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
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
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.role !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'Start by inviting your first user'
                }
              </p>
              <Button asChild>
                <Link to="/master/users/invite">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite First User
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
