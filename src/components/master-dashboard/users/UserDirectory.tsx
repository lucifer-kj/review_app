import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Users, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Calendar,
  Shield,
  Building2,
  UserX
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UserService, User } from "@/services/userService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserDirectory() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => UserService.getAllUsers(),
    refetchInterval: 30000,
  });

  // No more invitations - magic links are instant
  const invitations: any[] = [];
  const invitationsLoading = false;
  const invitationsError = null;

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // No invitations to filter since we use magic links
  const filteredInvitations: any[] = [];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'tenant_admin': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  if (usersLoading || invitationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Directory</h2>
            <p className="text-muted-foreground">
              Manage platform users and their access
            </p>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Directory</h2>
          <p className="text-muted-foreground">
            Manage platform users and their access
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs for Users and Invitations */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users ({filteredUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {usersError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load users. Please check your connection and try again.
              </AlertDescription>
            </Alert>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  {searchTerm ? "No users found" : "No users yet"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm 
                    ? "Try adjusting your search terms."
                    : "Get started by inviting your first user."
                  }
                </p>
                {!searchTerm && (
                  <Button asChild className="mt-4">
                    <Link to="/master/users/invite">
                      <Plus className="mr-2 h-4 w-4" />
                      Invite First User
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{user.email}</p>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {user.tenant_name && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="h-4 w-4" />
                                <span>{user.tenant_name}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <UserX className="mr-2 h-4 w-4" />
                            Suspend User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
