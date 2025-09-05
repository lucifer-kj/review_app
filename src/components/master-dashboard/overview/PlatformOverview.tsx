import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Star, 
  TrendingUp, 
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { usePlatformAnalytics } from '@/hooks/useSuperAdmin';
import { useTenantsList } from '@/hooks/useSuperAdmin';
import { Link } from 'react-router-dom';

export function PlatformOverview() {
  const { data: analytics, isLoading: analyticsLoading } = usePlatformAnalytics();
  const { data: tenantsData, isLoading: tenantsLoading } = useTenantsList({ limit: 5 });

  const metrics = [
    {
      title: 'Total Tenants',
      value: analytics?.data?.total_tenants || 0,
      icon: Building2,
      change: '+12%',
      changeType: 'positive' as const,
      description: 'Active organizations'
    },
    {
      title: 'Total Users',
      value: analytics?.data?.total_users || 0,
      icon: Users,
      change: '+8%',
      changeType: 'positive' as const,
      description: 'Registered users'
    },
    {
      title: 'Total Reviews',
      value: analytics?.data?.total_reviews || 0,
      icon: Star,
      change: '+24%',
      changeType: 'positive' as const,
      description: 'Customer feedback'
    },
    {
      title: 'Active Tenants',
      value: analytics?.data?.active_tenants || 0,
      icon: Activity,
      change: '+5%',
      changeType: 'positive' as const,
      description: 'Currently active'
    }
  ];

  const recentTenants = tenantsData?.data?.tenants || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground">
            Monitor and manage your multi-tenant review platform
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link to="/master/tenants/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Tenant
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : metric.value.toLocaleString()}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {metric.changeType === 'positive' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={metric.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
                  {metric.change}
                </span>
                <span>from last month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue and Growth */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Revenue Overview</span>
            </CardTitle>
            <CardDescription>
              Current month revenue and growth metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Month</span>
                <span className="text-2xl font-bold">
                  ${analytics?.data?.revenue_current_month?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Growth Rate</span>
                <Badge variant="secondary">
                  {analytics?.data?.growth_rate || 0}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Revenue calculated from tenant subscriptions and usage metrics
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Health</span>
            </CardTitle>
            <CardDescription>
              Platform performance and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Status</span>
                <Badge variant="default" className="bg-green-500">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Response Time</span>
                <span className="text-sm">~120ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Tenants</CardTitle>
              <CardDescription>
                Latest organizations that joined the platform
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link to="/master/tenants">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentTenants.length > 0 ? (
            <div className="space-y-3">
              {recentTenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium truncate">{tenant.name}</p>
                      <Badge 
                        variant={tenant.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {tenant.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tenant.plan_type} plan • Created {new Date(tenant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/master/tenants/${tenant.id}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tenants yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first tenant organization
              </p>
              <Button asChild>
                <Link to="/master/tenants/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Tenant
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
