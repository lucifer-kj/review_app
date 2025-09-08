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
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { InvitationService } from "@/services/invitationService";

interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  role?: string;
  tenant_id?: string;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
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

  // Fetch all users from profiles table with real-time updates
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['platform-users', { searchTerm: debouncedSearchTerm, page, pageSize }],
    queryFn: async () => {
      // Use profiles table instead of admin API
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          role,
          tenant_id,
          created_at,
          updated_at,
          tenants!inner(name)
        `)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.ilike('email', `%${debouncedSearchTerm}%`);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      return {
        users: data || [],
        total: count || 0,
        page: page,
        pageSize: pageSize
      };
    },
    refetchInterval: 10000, // More frequent updates for real-time feel
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // No need for separate profiles query since we get role info in main query

  // Fetch pending invitations
  const { data: invitations } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          id,
          email,
          role,
          expires_at,
          used_at,
          created_at,
          tenants!inner(name)
        `)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Promote user to super admin mutation
  const promoteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: 'super_admin',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: "User Promoted",
        description: "User has been promoted to Super Admin successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Promotion Failed",
        description: error.message || "Failed to promote user to Super Admin.",
        variant: "destructive",
      });
    },
  });

  // Demote user from super admin mutation
  const demoteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: 'tenant_admin',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: "User Demoted",
        description: "User has been demoted from Super Admin.",
      });
    },
    onError: (error) => {
      toast({
        title: "Demotion Failed",
        description: error.message || "Failed to demote user.",
        variant: "destructive",
      });
    },
  });

  const getUserRole = (user: any) => {
    return user?.role || 'user';
  };

  const getUserTenant = (user: any) => {
    return user?.tenant_id || null;
  };

  const getUserTenantName = (user: any) => {
    return user?.tenants?.name || 'No Tenant';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'tenant_admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'tenant_admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage platform users and their roles
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
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage platform users and their roles
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load users. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredUsers = users?.users ?? [];
  const pendingInvitations = invitations ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage platform users and their roles
          </p>
        </div>
        <Button asChild>
          <Link to="/master/users/invite">
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Pending Invitations ({pendingInvitations.length})</span>
            </CardTitle>
            <CardDescription>
              Users who have been invited but haven't accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {new Date(invitation.created_at).toLocaleDateString()} • {invitation.tenants?.name || 'No Tenant'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{invitation.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Platform Users ({filteredUsers.length})</span>
          </CardTitle>
          <CardDescription>
            All users registered on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchTerm ? "No users found" : "No users yet"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search terms."
                  : "Users will appear here once they register."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const role = getUserRole(user);
                const tenantId = getUserTenant(user);
                const tenantName = getUserTenantName(user);
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(role)}
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            {tenantName && (
                              <>
                                <span>•</span>
                                <span>{tenantName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge variant={getRoleBadgeVariant(role)}>
                        {role.replace('_', ' ')}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {role !== 'super_admin' && (
                            <DropdownMenuItem 
                              onClick={() => promoteUserMutation.mutate(user.id)}
                              disabled={promoteUserMutation.isPending}
                            >
                              <Crown className="mr-2 h-4 w-4" />
                              Promote to Super Admin
                            </DropdownMenuItem>
                          )}
                          {role === 'super_admin' && (
                            <DropdownMenuItem 
                              onClick={() => demoteUserMutation.mutate(user.id)}
                              disabled={demoteUserMutation.isPending}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Demote from Super Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <UserCheck className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Page {users?.page ?? 1} of {users ? Math.max(1, Math.ceil(users.total / (users.pageSize || pageSize))) : 1}
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={(users?.page ?? 1) <= 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={users ? (users.page * users.pageSize) >= users.total : true}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
