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
  TrendingDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PerformanceMonitoringService, PerformanceReport, PerformanceMetric, PerformanceAlert } from "@/services/performanceMonitoringService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function PerformanceDashboard() {
  const queryClient = useQueryClient();
  const [selectedMetric, setSelectedMetric] = useState<PerformanceMetric | null>(null);

  const { data: performanceReport, isLoading, error } = useQuery({
    queryKey: ['performance-report'],
    queryFn: () => PerformanceMonitoringService.getPerformanceReport(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const refreshReportMutation = useMutation({
    mutationFn: () => PerformanceMonitoringService.getPerformanceReport(),
    onSuccess: (newReport) => {
      queryClient.setQueryData(['performance-report'], newReport);
      toast.success("Performance report refreshed!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to refresh performance report");
    },
  });

  // Start performance monitoring on component mount
  useEffect(() => {
    PerformanceMonitoringService.startMonitoring();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'api': return <Globe className="h-4 w-4" />;
      case 'frontend': return <Monitor className="h-4 w-4" />;
      case 'memory': return <Memory className="h-4 w-4" />;
      case 'network': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'database': return 'text-blue-500';
      case 'api': return 'text-green-500';
      case 'frontend': return 'text-purple-500';
      case 'memory': return 'text-orange-500';
      case 'network': return 'text-cyan-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getPerformanceTrend = (metric: PerformanceMetric) => {
    // This would typically compare with historical data
    // For now, return a mock trend
    return Math.random() > 0.5 ? 'up' : 'down';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor system performance and optimization
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
          <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor system performance and optimization
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load performance data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const report = performanceReport!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor system performance and optimization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => refreshReportMutation.mutate()}
            disabled={refreshReportMutation.isPending}
          >
            {refreshReportMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Performance Score Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.overall_score}/100</div>
            <p className="text-xs text-muted-foreground">
              {report.overall_score >= 90 ? 'Excellent' : 
               report.overall_score >= 70 ? 'Good' : 
               report.overall_score >= 50 ? 'Fair' : 'Poor'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{report.alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Performance issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metrics Tracked</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.metrics.length}</div>
            <p className="text-xs text-muted-foreground">
              Performance metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(report.timestamp).toLocaleTimeString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time monitoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
            <CardDescription>
              Action items to improve system performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="mt-1">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Performance Alerts */}
      {report.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Alerts</CardTitle>
            <CardDescription>
              Active performance issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.alerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => PerformanceMonitoringService.resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Real-time performance data by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Metrics</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="frontend">Frontend</TabsTrigger>
              <TabsTrigger value="memory">Memory</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {report.metrics.map((metric) => (
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
                    <div className="flex items-center space-x-2">
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
                      {getPerformanceTrend(metric) === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {['database', 'api', 'frontend', 'memory', 'network'].map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {report.metrics
                  .filter(metric => metric.category === category)
                  .map((metric) => (
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
                              {new Date(metric.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
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
                          {getPerformanceTrend(metric) === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

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
