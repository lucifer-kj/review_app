import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Building2,
  Activity,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AuditLogService, AuditLog, AuditLogFilters } from "@/services/auditLogService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function AuditLogViewer() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditData, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => AuditLogService.getAuditLogs(filters),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => AuditLogService.getAuditStats(),
  });

  const filteredLogs = auditData?.logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('login') || action.includes('register')) return 'default';
    if (action.includes('create') || action.includes('invite')) return 'secondary';
    if (action.includes('update') || action.includes('change')) return 'outline';
    if (action.includes('delete') || action.includes('suspend')) return 'destructive';
    return 'outline';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('logout')) return <User className="h-4 w-4" />;
    if (action.includes('tenant')) return <Building2 className="h-4 w-4" />;
    if (action.includes('error')) return <AlertCircle className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Monitor system activity and user actions
          </p>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">
          Monitor system activity and user actions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events}</div>
              <p className="text-xs text-muted-foreground">
                All time audit events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Action</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(stats.events_by_action)
                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Most frequent action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.events_by_day
                  .find(day => day.date === new Date().toISOString().split('T')[0])?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Events today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter audit logs by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select
                value={filters.action || ""}
                onValueChange={(value) => setFilters({ ...filters, action: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="user_login">User Login</SelectItem>
                  <SelectItem value="user_logout">User Logout</SelectItem>
                  <SelectItem value="tenant_created">Tenant Created</SelectItem>
                  <SelectItem value="user_invited">User Invited</SelectItem>
                  <SelectItem value="review_created">Review Created</SelectItem>
                  <SelectItem value="settings_updated">Settings Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resource Type</label>
              <Select
                value={filters.resource_type || ""}
                onValueChange={(value) => setFilters({ ...filters, resource_type: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All resources</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Limit</label>
              <Select
                value={filters.limit?.toString() || "50"}
                onValueChange={(value) => setFilters({ ...filters, limit: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load audit logs. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Showing {filteredLogs.length} of {auditData?.total || 0} events
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No audit logs found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                            {log.resource_type && (
                              <Badge variant="outline">
                                {log.resource_type}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="text-sm">
                              <details className="cursor-pointer">
                                <summary className="text-muted-foreground hover:text-foreground">
                                  View details
                                </summary>
                                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{new Date(log.created_at).toLocaleString()}</div>
                        {log.ip_address && (
                          <div className="text-xs">IP: {log.ip_address}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
