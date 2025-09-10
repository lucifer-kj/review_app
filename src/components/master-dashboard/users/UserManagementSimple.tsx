import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Plus, 
  Crown, 
  Shield, 
  User, 
  Mail, 
  Calendar,
  MoreHorizontal,
  UserCheck,
  UserX,
  UserPlus,
  AlertTriangle,
  Key,
  Ban,
  Unlock,
  Send,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserService } from "@/services/userService";
import { MagicLinkService } from "@/services/magicLinkService";
import CreateUserForm from "./CreateUserForm";

interface User {
  id: string;
  email: string;
  role: string;
  tenant_id?: string;
  tenant_name?: string;
  created_at: string;
  updated_at: string;
}

export default function UserManagementSimple() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const pageSize = 20;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch all users using UserService
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['platform-users', { searchTerm: debouncedSearchTerm, page, pageSize }],
    queryFn: async () => {
      console.log('Fetching users...');
      
      try {
        // Use UserService to get all users
        const allUsers = await UserService.getAllUsers();
        console.log('Users fetched:', allUsers.length);

        // Apply search filter
        let filteredUsers = allUsers;
        if (debouncedSearchTerm) {
          filteredUsers = allUsers.filter(user =>
            user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            user.tenant_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
        }

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        console.log('Users processed:', {
          total: allUsers.length,
          filtered: filteredUsers.length,
          paginated: paginatedUsers.length,
          page,
          pageSize
        });

        return {
          users: paginatedUsers,
          total: filteredUsers.length,
          page: page,
          pageSize: pageSize
        };

      } catch (error) {
        console.error('Error fetching users:', error);
        // Return empty result instead of throwing to prevent UI crash
        return {
          users: [],
          total: 0,
          page: page,
          pageSize: pageSize
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1, // Reduce retries to prevent excessive API calls
    retryDelay: 2000,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await UserService.deleteUser(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: "destructive",
      });
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role, tenantId }: { email: string; role: string; tenantId?: string }) => {
      const result = await MagicLinkService.inviteUserWithMagicLink({
        email,
        fullName: email.split('@')[0], // Use email prefix as name
        role: role as 'super_admin' | 'tenant_admin' | 'user',
        tenantId,
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitation');
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Magic link invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (error) => {
      toast({
        title: "Invitation Failed",
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: "destructive",
      });
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'tenant_admin': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'tenant_admin': return <Shield className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <AppErrorBoundary componentName="UserManagement">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">
                Manage platform users and their access
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

          {/* Users List Skeleton */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppErrorBoundary>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage platform users and their access
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load users. This might be due to missing admin configuration. 
            Please check that the service role key is properly configured in your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalPages = Math.ceil((users?.total || 0) / pageSize);

  return (
    <AppErrorBoundary componentName="UserManagement">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage platform users and their access
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateUserDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
          <Button asChild variant="outline">
            <Link to="/master/users/invite">
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Users ({users?.total || 0})
          </CardTitle>
          <CardDescription>
            Search and manage platform users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by email, role, or tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['platform-users'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          {users?.users && users.users.length > 0 ? (
            <div className="divide-y">
              {users.users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getInitials(user.email)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.email}
                          </p>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {user.email}
                          </span>
                          {user.tenant_name && (
                            <span className="flex items-center">
                              <Shield className="h-4 w-4 mr-1" />
                              {user.tenant_name}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <UserCheck className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <UserX className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this user? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No users match your search criteria.' : 'No users available. This might be due to admin client configuration issues.'}
              </p>
              {!searchTerm && (
                <div className="space-y-2">
                  <Button asChild>
                    <Link to="/master/users/invite">
                      <Plus className="h-4 w-4 mr-2" />
                      Invite User
                    </Link>
                  </Button>
                  <p className="text-xs text-gray-400">
                    If you continue to see no users, please check your admin configuration.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, users?.total || 0)} of {users?.total || 0} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      {showCreateUserDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CreateUserForm
              onSuccess={() => {
                setShowCreateUserDialog(false);
                setPage(1); // Reset to first page
              }}
              onCancel={() => setShowCreateUserDialog(false)}
            />
          </div>
        </div>
      )}
      </div>
    </AppErrorBoundary>
  );
}
