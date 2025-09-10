import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  Users, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertCircle, 
  RefreshCw,
  DollarSign,
  Star,
  Activity,
  Clock,
  Shield,
  Zap
} from "lucide-react";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState } from "react";
import { toast } from "sonner";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

export default function PlatformOverview() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { data: analytics, isLoading, error, refetch } = usePlatformMetrics();

  // Enable real-time updates for master dashboard
  useRealtimeUpdates({
    tables: [
      {
        table: 'reviews',
        queryKey: ['platform-metrics'],
        events: ['INSERT', 'UPDATE', 'DELETE']
      },
      {
        table: 'profiles',
        queryKey: ['platform-metrics'],
        events: ['INSERT', 'UPDATE', 'DELETE']
      },
      {
        table: 'tenants',
        queryKey: ['platform-metrics'],
        events: ['INSERT', 'UPDATE', 'DELETE']
      }
    ],
    enabled: true,
    onError: (error) => {
      console.error('Master dashboard real-time update error:', error);
    }
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      setLastRefresh(new Date());
      toast.success("Analytics refreshed!");
    } catch (error) {
      toast.error("Failed to refresh analytics");
    }
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? "text-green-500" : "text-red-500";
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  };

  // Chart data based on analytics - will be populated when real data is available
  const chartData = [
    { name: 'Jan', tenants: 5, users: 25, reviews: 120 },
    { name: 'Feb', tenants: 8, users: 45, reviews: 180 },
    { name: 'Mar', tenants: 12, users: 65, reviews: 250 },
    { name: 'Apr', tenants: 15, users: 85, reviews: 320 },
    { name: 'May', tenants: 18, users: 105, reviews: 400 },
    { name: 'Jun', tenants: 22, users: 125, reviews: 480 },
  ];

  // Update chart data with real analytics if available
  const updatedChartData = chartData.map(item => ({
    ...item,
    tenants: analytics?.total_tenants || item.tenants,
    users: analytics?.total_users || item.users,
    reviews: analytics?.total_reviews || item.reviews,
  }));

  const pieData = [
    { name: 'Active Tenants', value: analytics?.active_tenants || 0, color: '#10b981' },
    { name: 'Suspended Tenants', value: (analytics?.total_tenants || 0) - (analytics?.active_tenants || 0), color: '#ef4444' },
  ];

  if (isLoading) {
    return (
      <AppErrorBoundary componentName="PlatformOverview">
      <div className={cn(
            "space-y-4 sm:space-y-6",
            // Mobile: smaller spacing
            "space-y-4",
            // Tablet: medium spacing
            "sm:space-y-5",
            // Desktop: full spacing
            "lg:space-y-6"
          )}>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Overview</h2>
          <p className="text-muted-foreground">
              Real-time platform analytics and performance metrics
          </p>
        </div>
          
          {/* Metrics Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* System Health Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
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
      <div className={cn(
            "space-y-4 sm:space-y-6",
            // Mobile: smaller spacing
            "space-y-4",
            // Tablet: medium spacing
            "sm:space-y-5",
            // Desktop: full spacing
            "lg:space-y-6"
          )}>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Overview</h2>
          <p className="text-muted-foreground">
            Welcome to the Crux master dashboard. Manage your platform from here.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load platform analytics. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const defaults = {
    total_tenants: 0,
    active_tenants: 0,
    suspended_tenants: 0,
    total_users: 0,
    active_users: 0,
    total_reviews: 0,
    reviews_this_month: 0,
    reviews_last_month: 0,
    average_rating: 0,
    total_revenue: 0,
    revenue_this_month: 0,
    revenue_growth_rate: 0,
    review_growth_rate: 0,
    user_growth_rate: 0,
    tenant_growth_rate: 0,
    system_health_score: 0,
    last_updated: new Date().toISOString()
  };

  // Merge analytics over defaults to avoid undefined values in templates
  const stats = { ...defaults, ...(analytics as any || {}) } as typeof defaults;

  return (
    <AppErrorBoundary componentName="PlatformOverview">
    <div className={cn(
            "space-y-4 sm:space-y-6",
            // Mobile: smaller spacing
            "space-y-4",
            // Tablet: medium spacing
            "sm:space-y-5",
            // Desktop: full spacing
            "lg:space-y-6"
          )}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Overview</h2>
          <p className="text-muted-foreground">
            Real-time platform analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_tenants}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">
                {stats.active_tenants} active
              </p>
              <div className="flex items-center">
                {getGrowthIcon(stats.tenant_growth_rate)}
                <span className={`text-xs ${getGrowthColor(stats.tenant_growth_rate)}`}>
                  {stats.tenant_growth_rate >= 0 ? '+' : ''}{stats.tenant_growth_rate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">
                {stats.active_users} active
              </p>
              <div className="flex items-center">
                {getGrowthIcon(stats.user_growth_rate)}
                <span className={`text-xs ${getGrowthColor(stats.user_growth_rate)}`}>
                  {stats.user_growth_rate >= 0 ? '+' : ''}{stats.user_growth_rate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_reviews}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">
                {stats.reviews_this_month} this month
              </p>
              <div className="flex items-center">
                {getGrowthIcon(stats.review_growth_rate)}
                <span className={`text-xs ${getGrowthColor(stats.review_growth_rate)}`}>
                  {stats.review_growth_rate >= 0 ? '+' : ''}{stats.review_growth_rate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(stats.system_health_score)}`}>
              {stats.system_health_score}/100
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={stats.system_health_score >= 70 ? "default" : "destructive"}>
                {getHealthBadge(stats.system_health_score)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_revenue.toLocaleString()}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">
                ${stats.revenue_this_month.toLocaleString()} this month
              </p>
              <div className="flex items-center">
                {getGrowthIcon(stats.revenue_growth_rate)}
                <span className={`text-xs ${getGrowthColor(stats.revenue_growth_rate)}`}>
                  {stats.revenue_growth_rate >= 0 ? '+' : ''}{stats.revenue_growth_rate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviews_this_month}</div>
            <p className="text-xs text-muted-foreground">
              vs {stats.reviews_last_month} last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Tenants</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.suspended_tenants}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>
              Platform growth over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={updatedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="tenants" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                <Area type="monotone" dataKey="reviews" stackId="1" stroke="#ffc658" fill="#ffc658" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Status</CardTitle>
            <CardDescription>
              Distribution of tenant status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and System Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Building2 className="mr-2 h-4 w-4" />
              Create New Tenant
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Invite Platform Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              View System Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="mr-2 h-4 w-4" />
              Review Audit Logs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Platform health and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <p className="text-sm">Database</p>
              </div>
              <Badge variant="default">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <p className="text-sm">Authentication</p>
              </div>
              <Badge variant="default">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <p className="text-sm">Email Service</p>
              </div>
              <Badge variant="default">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <p className="text-sm">API Gateway</p>
              </div>
              <Badge variant="default">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AppErrorBoundary>
  );
}
