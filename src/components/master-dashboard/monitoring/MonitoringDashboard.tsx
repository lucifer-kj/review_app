import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Database,
  Globe,
  Monitor,
  Memory,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  Users,
  BarChart3,
  Clock,
  Server
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MonitoringService, MonitoringDashboard, MonitoringAlert, MonitoringMetric } from "@/services/monitoringService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function MonitoringDashboard() {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<MonitoringAlert | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MonitoringMetric | null>(null);

  const { data: monitoringData, isLoading, error } = useQuery({
    queryKey: ['monitoring-dashboard'],
    queryFn: () => MonitoringService.getMonitoringDashboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const refreshDataMutation = useMutation({
    mutationFn: () => MonitoringService.getMonitoringDashboard(),
    onSuccess: (newData) => {
      queryClient.setQueryData(['monitoring-dashboard'], newData);
      toast.success("Monitoring data refreshed!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to refresh monitoring data");
    },
  });

  // Start monitoring on component mount
  useEffect(() => {
    MonitoringService.startMonitoring();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <Server className="h-4 w-4" />;
      case 'performance': return <Activity className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'business': return <BarChart3 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'text-blue-500';
      case 'performance': return 'text-green-500';
      case 'security': return 'text-red-500';
      case 'business': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Server className="h-4 w-4" />;
      case 'performance': return <Activity className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'business': return <BarChart3 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system': return 'text-blue-500';
      case 'performance': return 'text-green-500';
      case 'security': return 'text-red-500';
      case 'business': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time system monitoring and alerting
          </p>
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time system monitoring and alerting
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load monitoring data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = monitoringData!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time system monitoring and alerting
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => refreshDataMutation.mutate()}
            disabled={refreshDataMutation.isPending}
          >
            {refreshDataMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system_health}/100</div>
            <p className="text-xs text-muted-foreground">
              {data.system_health >= 90 ? 'Excellent' : 
               data.system_health >= 70 ? 'Good' : 
               data.system_health >= 50 ? 'Fair' : 'Poor'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{data.active_alerts}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.uptime}%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.response_time.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              System performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Alerts ({data.alerts.length})
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <Activity className="mr-2 h-4 w-4" />
            Metrics ({data.metrics.length})
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="mr-2 h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                System alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-semibold">No Active Alerts</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    All systems are operating normally.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {getTypeIcon(alert.type)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{alert.title}</h4>
                              <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline">{alert.type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(alert.severity)}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              MonitoringService.resolveAlert(alert.id);
                              toast.success("Alert resolved!");
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Metrics</CardTitle>
              <CardDescription>
                Real-time system metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.metrics.map((metric) => (
                  <div 
                    key={metric.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedMetric(metric)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={getCategoryColor(metric.category)}>
                          {getCategoryIcon(metric.category)}
                        </div>
                        <div>
                          <h4 className="font-medium">{metric.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {metric.category} • {new Date(metric.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {metric.value.toFixed(2)} {metric.unit}
                        </div>
                        {metric.threshold && (
                          <div className="text-xs text-muted-foreground">
                            Warning: {metric.threshold.warning}{metric.unit} | 
                            Critical: {metric.threshold.critical}{metric.unit}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Overall system health metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Database Health</span>
                    <span className="text-sm font-medium">Healthy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">API Health</span>
                    <span className="text-sm font-medium">Healthy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">Normal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>
                  System performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Response Time</span>
                    <span className="text-sm font-medium">{data.response_time.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime</span>
                    <span className="text-sm font-medium">{data.uptime}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">System Load</span>
                    <span className="text-sm font-medium">Normal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {data.response_time.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {data.uptime}%
                  </div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {data.system_health}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Health Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedAlert.title}</CardTitle>
                <CardDescription>
                  {selectedAlert.type} • {new Date(selectedAlert.timestamp).toLocaleString()}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Severity</h4>
                <Badge variant={getSeverityBadgeVariant(selectedAlert.severity)}>
                  {selectedAlert.severity}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Type</h4>
                <Badge variant="outline">{selectedAlert.type}</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Message</h4>
              <p className="text-sm text-muted-foreground">
                {selectedAlert.message}
              </p>
            </div>
            
            {Object.keys(selectedAlert.metadata).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Metadata</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(selectedAlert.metadata, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metric Details Modal */}
      {selectedMetric && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedMetric.name}</CardTitle>
                <CardDescription>
                  {selectedMetric.category} • {new Date(selectedMetric.timestamp).toLocaleString()}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedMetric(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Current Value</h4>
                <div className="text-2xl font-bold">
                  {selectedMetric.value.toFixed(2)} {selectedMetric.unit}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Category</h4>
                <Badge variant="outline">{selectedMetric.category}</Badge>
              </div>
            </div>
            
            {selectedMetric.threshold && (
              <div>
                <h4 className="font-medium mb-2">Thresholds</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="p-2 bg-yellow-50 rounded">
                    <div className="text-sm font-medium text-yellow-800">Warning</div>
                    <div className="text-sm text-yellow-600">
                      {selectedMetric.threshold.warning} {selectedMetric.unit}
                    </div>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <div className="text-sm font-medium text-red-800">Critical</div>
                    <div className="text-sm text-red-600">
                      {selectedMetric.threshold.critical} {selectedMetric.unit}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
