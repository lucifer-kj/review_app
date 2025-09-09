import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { SimpleUserService } from '@/services/simpleUserService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  UserPlus, 
  Search, 
  Users, 
  Shield, 
  User, 
  Crown,
  Trash2,
  Edit,
  Mail,
  Calendar
} from 'lucide-react';

interface TenantUser {
  id: string;
  email: string;
  full_name: string;
  role: 'tenant_admin' | 'user';
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserSearchResult {
  id: string;
  email: string;
  full_name: string;
  current_tenant_id: string | null;
  current_role: string | null;
}

interface TenantUserManagerProps {
  tenantId: string;
  tenantName: string;
}

export default function TenantUserManager({ tenantId, tenantName }: TenantUserManagerProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [allUsers, setAllUsers] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<'tenant_admin' | 'user'>('user');
  const [addingUser, setAddingUser] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Load tenant users
  const loadTenantUsers = async () => {
    try {
      setLoading(true);
      
      const response = await SimpleUserService.getTenantUsers(tenantId);
      
      if (response.success && response.data) {
        const tenantUsers: TenantUser[] = response.data.map(user => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role as 'tenant_admin' | 'user',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        }));
        setUsers(tenantUsers);
      } else {
        console.error('Failed to load tenant users:', response.error);
        toast({
          title: "Error",
          description: response.error || "Failed to load tenant users",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading tenant users:', error);
      toast({
        title: "Error",
        description: "Failed to load tenant users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Search for users to add
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await SimpleUserService.searchUsers(query, 10);
      
      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        console.error('Search failed:', response.error);
        toast({
          title: "Search Error",
          description: response.error || "Failed to search users",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  // Add user to tenant
  const addUserToTenant = async () => {
    if (!selectedUser) return;

    try {
      setAddingUser(true);

      const response = await SimpleUserService.addUserToTenant(selectedUser.id, tenantId, selectedRole);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `${selectedUser.full_name} has been added to ${tenantName}`,
        });

        // Refresh users list
        await loadTenantUsers();
        
        // Reset form
        setSelectedUser(null);
        setSelectedRole('user');
        setSearchQuery('');
        setSearchResults([]);
        setShowAddDialog(false);
      } else {
        throw new Error(response.error || 'Failed to add user to tenant');
      }
    } catch (error) {
      console.error('Error adding user to tenant:', error);
      toast({
        title: "Error",
        description: "Failed to add user to tenant",
        variant: "destructive"
      });
    } finally {
      setAddingUser(false);
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: 'tenant_admin' | 'user') => {
    try {
      setUpdatingRole(userId);

      const response = await SimpleUserService.updateUserRole(userId, newRole);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User role updated successfully",
        });

        // Refresh users list
        await loadTenantUsers();
      } else {
        throw new Error(response.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  // Remove user from tenant
  const removeUserFromTenant = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this tenant?`)) {
      return;
    }

    try {
      const response = await SimpleUserService.removeUserFromTenant(userId, tenantId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `${userName} has been removed from ${tenantName}`,
        });

        // Refresh users list
        await loadTenantUsers();
      } else {
        throw new Error(response.error || 'Failed to remove user from tenant');
      }
    } catch (error) {
      console.error('Error removing user from tenant:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from tenant",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadTenantUsers();
  }, [tenantId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load all users when dialog opens
  useEffect(() => {
    if (showAddDialog && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [showAddDialog]);

  const loadAllUsers = async () => {
    try {
      setLoadingAllUsers(true);
      
      const response = await SimpleUserService.getAllUsers(50);
      
      if (response.success && response.data) {
        const allUsers: UserSearchResult[] = response.data.map(user => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          current_tenant_id: null, // Will be updated after migration
          current_role: user.role,
        }));
        setAllUsers(allUsers);
      } else {
        console.error('Failed to load all users:', response.error);
      }
    } catch (error) {
      console.error('Error loading all users:', error);
    } finally {
      setLoadingAllUsers(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'tenant_admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tenant Users
        </CardTitle>
        <CardDescription>
          Manage users in the {tenantName} workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Add User Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User to Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add User to Tenant</DialogTitle>
                <DialogDescription>
                  Search for an existing user and add them to {tenantName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="user-search"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searching && (
                    <div className="flex items-center gap-2 mt-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-gray-500">Searching...</span>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchQuery.length >= 2 && searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Search Results</Label>
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                            selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            </div>
                            <div className="text-right">
                              {user.current_tenant_id ? (
                                <Badge variant="outline" className="text-xs">
                                  In Tenant
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Available
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Users Dropdown */}
                {searchQuery.length < 2 && (
                  <div className="space-y-2">
                    <Label>All Users</Label>
                    {loadingAllUsers ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-sm text-gray-500">Loading users...</span>
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {allUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                              selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </p>
                              </div>
                              <div className="text-right">
                                {user.current_tenant_id ? (
                                  <Badge variant="outline" className="text-xs">
                                    In Tenant
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Available
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {allUsers.length === 0 && (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No users found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedUser && (
                  <div>
                    <Label htmlFor="user-role">Role in Tenant</Label>
                    <Select value={selectedRole} onValueChange={(value: 'tenant_admin' | 'user') => setSelectedRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            User
                          </div>
                        </SelectItem>
                        <SelectItem value="tenant_admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Tenant Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedUser && selectedUser.current_tenant_id && (
                  <Alert>
                    <AlertDescription>
                      This user is already assigned to another tenant. Adding them here will move them to this tenant.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    disabled={addingUser}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addUserToTenant}
                    disabled={!selectedUser || addingUser}
                  >
                    {addingUser ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      'Add User'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users in this tenant yet</p>
              <p className="text-sm text-gray-400">Add users to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {users.length} user{users.length !== 1 ? 's' : ''} in this tenant
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at ? (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(user.last_sign_in_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(value: 'tenant_admin' | 'user') => 
                                updateUserRole(user.id, value)
                              }
                              disabled={updatingRole === user.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    User
                                  </div>
                                </SelectItem>
                                <SelectItem value="tenant_admin">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeUserFromTenant(user.id, user.full_name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
