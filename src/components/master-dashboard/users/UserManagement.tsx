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
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin, withAdminAuth } from "@/integrations/supabase/admin";
import { MagicLinkService } from "@/services/magicLinkService";
import { UserService } from "@/services/userService";
import AdminClientTest from "@/components/debug/AdminClientTest";

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
      console.log('Fetching users...');
      
      try {
        // First, try to get users from auth.users using admin client
        console.log('Attempting to fetch auth users...');
        const { data: authUsers, error: authError } = await withAdminAuth(async () => {
          return await supabaseAdmin.auth.admin.listUsers();
        });

        if (authError) {
          console.error('Auth users fetch error:', authError);
          throw authError;
        }

        console.log('Auth users fetched:', authUsers?.users?.length || 0);

        if (!authUsers?.users || authUsers.users.length === 0) {
          console.log('No auth users found, returning empty result');
          return {
            users: [],
            total: 0,
            page: page,
            pageSize: pageSize
          };
        }

        // Get user IDs from auth users
        const authUserIds = authUsers.users.map(user => user.id);
        
        // Try to get profiles for these users
        console.log('Fetching profiles for auth users...');
        let { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            role,
            tenant_id,
            created_at,
            updated_at
          `)
          .in('id', authUserIds)
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('Profiles fetch error:', profilesError);
          // If profiles don't exist, create them from auth users
          console.log('Creating profiles from auth users...');
          const profilesToCreate = authUsers.users.map(authUser => ({
            id: authUser.id,
            email: authUser.email || '',
            role: 'user', // Default role
            tenant_id: null, // Will be set when they join a tenant
            created_at: authUser.created_at,
            updated_at: authUser.updated_at
          }));

          const { data: createdProfiles, error: createError } = await supabase
            .from('profiles')
            .upsert(profilesToCreate)
            .select();

          if (createError) {
            console.error('Profile creation error:', createError);
            // Return auth users without profiles
            return {
              users: authUsers.users.map(authUser => ({
                id: authUser.id,
                email: authUser.email || '',
                role: 'user',
                tenant_id: null,
                tenant_name: 'No Tenant',
                created_at: authUser.created_at,
                updated_at: authUser.updated_at,
                banned_until: authUser.banned_until,
                email_confirmed_at: authUser.email_confirmed_at,
                last_sign_in_at: authUser.last_sign_in_at,
              })),
              total: authUsers.users.length,
              page: page,
              pageSize: pageSize
            };
          }

          // Use created profiles
          profiles = createdProfiles;
        }

        console.log('Profiles fetched:', profiles?.length || 0);

        // Apply search filter
        let filteredProfiles = profiles || [];
        if (debouncedSearchTerm) {
          filteredProfiles = filteredProfiles.filter(profile => 
            profile.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        const paginatedProfiles = filteredProfiles.slice(from, to);

        // Get tenant names
        const tenantIds = [...new Set(paginatedProfiles.map(user => user.tenant_id).filter(Boolean))];
        let tenantMap: Record<string, string> = {};
        
        if (tenantIds.length > 0) {
          const { data: tenants } = await supabase
            .from('tenants')
            .select('id, name')
            .in('id', tenantIds);

          tenantMap = tenants?.reduce((acc, tenant) => {
            acc[tenant.id] = tenant.name;
            return acc;
          }, {} as Record<string, string>) || {};
        }

        // Create auth user map for additional data
        const authUserMap = authUsers.users.reduce((acc, authUser) => {
          acc[authUser.id] = {
            banned_until: authUser.banned_until,
            email_confirmed_at: authUser.email_confirmed_at,
            last_sign_in_at: authUser.last_sign_in_at,
          };
          return acc;
        }, {} as Record<string, any>);

        const result = {
          users: paginatedProfiles.map(user => ({
            ...user,
            tenant_name: tenantMap[user.tenant_id] || 'No Tenant',
            banned_until: authUserMap[user.id]?.banned_until || null,
            email_confirmed_at: authUserMap[user.id]?.email_confirmed_at || null,
            last_sign_in_at: authUserMap[user.id]?.last_sign_in_at || null,
          })),
          total: filteredProfiles.length,
        page: page,
        pageSize: pageSize
      };

        console.log('Final result:', result);
        return result;

      } catch (error) {
        console.error('User fetch error:', error);
        throw error;
      }
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
          tenant_id
        `)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get tenant names separately
      const tenantIds = [...new Set(data?.map(inv => inv.tenant_id).filter(Boolean) || [])];
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds);

      const tenantMap = tenants?.reduce((acc, tenant) => {
        acc[tenant.id] = tenant.name;
        return acc;
      }, {} as Record<string, string>) || {};

      return data?.map(invitation => ({
        ...invitation,
        tenant_name: tenantMap[invitation.tenant_id] || 'Unknown'
      })) || [];
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

  // Send password recovery email mutation
  const sendPasswordRecoveryMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      });

      if (error) throw error;
      });
    },
    onSuccess: (_, email) => {
      toast({
        title: "Password Recovery Sent",
        description: `Password recovery email sent to ${email}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Recovery Email",
        description: error.message || "Failed to send password recovery email.",
        variant: "destructive",
      });
    },
  });

  // Send magic link mutation
  const sendMagicLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await MagicLinkService.sendMagicLinkToUser(email, '/dashboard');
      if (!result.success) {
        throw new Error(result.error || 'Failed to send magic link');
      }
      return result.data;
    },
    onSuccess: (_, email) => {
      toast({
        title: "Magic Link Sent",
        description: `Magic link sent to ${email}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Magic Link",
        description: error.message || "Failed to send magic link.",
        variant: "destructive",
      });
    },
  });


  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: '876000h' // 100 years (effectively permanent)
        });
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast({
        title: "User Banned",
        description: "User has been banned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Ban User",
        description: error.message || "Failed to ban user.",
        variant: "destructive",
      });
    },
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        });
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast({
        title: "User Unbanned",
        description: "User has been unbanned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Unban User",
        description: error.message || "Failed to unban user.",
        variant: "destructive",
      });
    },
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { suspended: true }
        });
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast({
        title: "User Suspended",
        description: "User has been suspended successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Suspend User",
        description: error.message || "Failed to suspend user.",
        variant: "destructive",
      });
    },
  });

  // Unsuspend user mutation
  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { suspended: false }
        });
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast({
        title: "User Unsuspended",
        description: "User has been unsuspended successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Unsuspend User",
        description: error.message || "Failed to unsuspend user.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.deleteUser(userId);
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete User",
        description: error.message || "Failed to delete user.",
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

  const isUserBanned = (user: any) => {
    if (!user.banned_until) return false;
    return new Date(user.banned_until) > new Date();
  };

  const isUserSuspended = (user: any) => {
    return user?.app_metadata?.suspended === true;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
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
            <div className="space-y-2">
              <p>Failed to load users. Error details:</p>
              <p className="text-sm font-mono bg-red-50 p-2 rounded">
                {error instanceof Error ? error.message : String(error)}
              </p>
              <p className="text-sm">
                Please check:
                <br />• Your Supabase service role key is configured correctly
                <br />• You have admin permissions
                <br />• The profiles table exists and has proper RLS policies
              </p>
            </div>
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
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

      {/* Debug Component - Remove this after fixing */}
      <AdminClientTest />

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
                  : "Users will appear here once they register or are invited."
                }
              </p>
              {!searchTerm && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
                  <h4 className="font-medium text-blue-900 mb-2">Debug Information:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Check browser console for detailed logs</li>
                    <li>• Verify Supabase service role key is configured</li>
                    <li>• Ensure profiles table exists with proper RLS policies</li>
                    <li>• Try creating a tenant to generate test users</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const role = getUserRole(user);
                const tenantId = getUserTenant(user);
                const tenantName = user.tenant_name || 'No Tenant';
                const isBanned = isUserBanned(user);
                const isSuspended = isUserSuspended(user);
                
                return (
                  <div key={user.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${isBanned ? 'bg-red-50 border-red-200' : isSuspended ? 'bg-orange-50 border-orange-200' : ''}`}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(role)}
                        <div>
                          <div className="flex items-center space-x-2">
                          <p className="font-medium">{user.email}</p>
                            {isBanned && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                Banned
                              </Badge>
                            )}
                            {isSuspended && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                <UserX className="h-3 w-3 mr-1" />
                                Suspended
                              </Badge>
                            )}
                            {!user.email_confirmed_at && (
                              <Badge variant="outline" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            {tenantName !== 'No Tenant' && (
                              <>
                                <span>•</span>
                                <span>{tenantName}</span>
                              </>
                            )}
                            {user.last_sign_in_at && (
                              <>
                                <span>•</span>
                                <span>Last seen {formatDate(user.last_sign_in_at)}</span>
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
                          {/* Password Recovery */}
                          <DropdownMenuItem 
                            onClick={() => sendPasswordRecoveryMutation.mutate(user.email)}
                            disabled={sendPasswordRecoveryMutation.isPending}
                          >
                            <Key className="mr-2 h-4 w-4" />
                            Send Password Recovery
                          </DropdownMenuItem>
                          
                          {/* Magic Link */}
                          <DropdownMenuItem 
                            onClick={() => sendMagicLinkMutation.mutate(user.email)}
                            disabled={sendMagicLinkMutation.isPending}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send Magic Link
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Ban/Unban */}
                          {!isBanned ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Ban User
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to ban {user.email}? This will prevent them from logging in.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => banUserMutation.mutate(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Ban User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => unbanUserMutation.mutate(user.id)}
                              disabled={unbanUserMutation.isPending}
                            >
                              <Unlock className="mr-2 h-4 w-4" />
                              Unban User
                            </DropdownMenuItem>
                          )}
                          
                          {/* Suspend/Unsuspend */}
                          {!isUserSuspended(user) ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Suspend User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to suspend {user.email}? This will prevent them from accessing the platform.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => suspendUserMutation.mutate(user.id)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    Suspend User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => unsuspendUserMutation.mutate(user.id)}
                              disabled={unsuspendUserMutation.isPending}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Unsuspend User
                            </DropdownMenuItem>
                          )}
                          
                          {/* Delete User */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <UserX className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete {user.email}? This action cannot be undone and will remove all their data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Role Management */}
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

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Pending Invitations ({invitations.length})</span>
            </CardTitle>
            <CardDescription>
              Users who have been invited but haven't accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Invited {new Date(invitation.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{invitation.tenant_name}</span>
                          <span>•</span>
                          <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {invitation.role.replace('_', ' ')}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => sendMagicLinkMutation.mutate(invitation.email)}
                          disabled={sendMagicLinkMutation.isPending}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Resend Magic Link
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Extend Invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
