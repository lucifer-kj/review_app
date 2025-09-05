import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Star, 
  Calendar, 
  Globe, 
  Mail, 
  Settings,
  Edit,
  ArrowLeft,
  Activity,
  TrendingUp,
  Shield,
  Database
} from 'lucide-react';
import { useTenantDetails, useTenantUsageStats, useCreateInvitation } from '@/hooks/useSuperAdmin';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function TenantDetails() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { data: tenantData, isLoading: tenantLoading } = useTenantDetails(tenantId!);
  const { data: usageData, isLoading: usageLoading } = useTenantUsageStats(tenantId!);
  const createInvitation = useCreateInvitation();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'tenant_admin' | 'user'>('user');

  const tenant = tenantData?.data;
  const usage = usageData?.data;

  const handleCreateInvitation = async () => {
    if (!inviteEmail || !tenantId) return;
    
    try {
      await createInvitation.mutateAsync({
        tenantId,
        email: inviteEmail,
        role: inviteRole
      });
      setInviteEmail('');
      // Show success message
    } catch (error) {
      console.error('Failed to create invitation:', error);
    }
  };

  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Tenant not found</h3>
        <p className="text-muted-foreground mb-4">
          The tenant you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link to="/master/tenants">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
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

  const getPlanBadgeVariant = (plan: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/master/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(tenant.status)}>
                    {tenant.status}
                  </Badge>
                  <Badge variant={getPlanBadgeVariant(tenant.plan_type)}>
                    {tenant.plan_type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link to={`/master/tenants/${tenant.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Tenant
            </Link>
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageLoading ? '...' : usage?.users_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active users in tenant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageLoading ? '...' : usage?.reviews_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer reviews collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageLoading ? '...' : `${Math.round((usage?.storage_used || 0) / 1024 / 1024)} MB`}
            </div>
            <p className="text-xs text-muted-foreground">
              Data storage consumption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageLoading ? '...' : usage?.last_activity 
                ? new Date(usage.last_activity).toLocaleDateString()
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Information</CardTitle>
                <CardDescription>
                  Basic information about this tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{tenant.name}</span>
                </div>
                {tenant.domain && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Domain:</span>
                    <a 
                      href={`https://${tenant.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {tenant.domain}
                    </a>
                  </div>
                )}
                {tenant.billing_email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Billing Email:</span>
                    <span className="text-sm">{tenant.billing_email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{new Date(tenant.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common actions for this tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users and invitations for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Invite New User</h4>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value: 'tenant_admin' | 'user') => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="tenant_admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleCreateInvitation}
                      disabled={!inviteEmail || createInvitation.isPending}
                    >
                      Send Invite
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">User List</h3>
                <p className="text-muted-foreground">
                  User management interface will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Settings</CardTitle>
              <CardDescription>
                Configure tenant-specific settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Settings Panel</h3>
                <p className="text-muted-foreground">
                  Tenant configuration interface will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Analytics</CardTitle>
              <CardDescription>
                Usage statistics and performance metrics for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and reporting will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
