import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Eye
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch audit logs
  const { data: auditLogs, isLoading, error } = useQuery({
    queryKey: ['audit-logs', { searchTerm, actionFilter, resourceFilter, page, pageSize }],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (resourceFilter !== 'all') {
        query = query.eq('resource_type', resourceFilter);
      }

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,resource_type.ilike.%${searchTerm}%,details::text.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data || [],
        total: count || 0,
        page: page,
        pageSize: pageSize
      };
    },
    keepPreviousData: true,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  // Get unique actions for filter
  const { data: uniqueActions } = useQuery({
    queryKey: ['audit-log-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .order('action');

      if (error) throw error;

      const actions = [...new Set(data?.map(log => log.action) || [])];
      return actions;
    },
  });

  // Get unique resource types for filter
  const { data: uniqueResourceTypes } = useQuery({
    queryKey: ['audit-log-resource-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('resource_type')
        .not('resource_type', 'is', null)
        .order('resource_type');

      if (error) throw error;

      const resourceTypes = [...new Set(data?.map(log => log.resource_type).filter(Boolean) || [])];
      return resourceTypes;
    },
  });

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (action.includes('update') || action.includes('edit')) {
      return <Activity className="h-4 w-4 text-blue-500" />;
    } else if (action.includes('delete') || action.includes('remove')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else {
      return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return 'default';
    } else if (action.includes('update') || action.includes('edit')) {
      return 'secondary';
    } else if (action.includes('delete') || action.includes('remove')) {
      return 'destructive';
    } else {
      return 'outline';
    }
  };

  const formatDetails = (details: any) => {
    if (!details) return 'No details';
    
    try {
      if (typeof details === 'string') {
        return details;
      }
      return JSON.stringify(details, null, 2);
    } catch {
      return 'Invalid details format';
    }
  };

  if (isLoading) {
    return (
      <AppErrorBoundary componentName="AuditLogs">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
              <p className="text-muted-foreground">
                Monitor platform activity and security events
              </p>
            </div>
          </div>
          
          {/* Filters Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-16" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Logs List Skeleton */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-4" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
            <p className="text-muted-foreground">
              Monitor platform activity and security events
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load audit logs. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const logs = auditLogs?.logs ?? [];

  return (
    <AppErrorBoundary componentName="AuditLogs">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Monitor platform activity and security events
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
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
            
            <div className="min-w-[150px]">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions?.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResourceTypes?.map((resourceType) => (
                    <SelectItem key={resourceType} value={resourceType}>
                      {resourceType?.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Activity Log ({auditLogs?.total || 0} entries)</span>
          </CardTitle>
          <CardDescription>
            Real-time platform activity and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchTerm || actionFilter !== 'all' || resourceFilter !== 'all' 
                  ? "No logs found" 
                  : "No activity yet"
                }
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm || actionFilter !== 'all' || resourceFilter !== 'all'
                  ? "Try adjusting your filters."
                  : "Activity logs will appear here as users interact with the platform."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getActionIcon(log.action)}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                          {log.resource_type && (
                            <Badge variant="outline">
                              {log.resource_type.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          
                          {log.user_id && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>User: {log.user_id.slice(0, 8)}...</span>
                            </div>
                          )}
                          
                          {log.tenant_id && (
                            <div className="flex items-center space-x-1">
                              <Activity className="h-3 w-3" />
                              <span>Tenant: {log.tenant_id.slice(0, 8)}...</span>
                            </div>
                          )}
                        </div>

                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                              <Eye className="inline h-3 w-3 mr-1" />
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                              {formatDetails(log.details)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Page {auditLogs?.page ?? 1} of {auditLogs ? Math.max(1, Math.ceil(auditLogs.total / (auditLogs.pageSize || pageSize))) : 1}
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={(auditLogs?.page ?? 1) <= 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={auditLogs ? (auditLogs.page * auditLogs.pageSize) >= auditLogs.total : true}>
            Next
          </Button>
        </div>
      </div>
      </div>
    </AppErrorBoundary>
  );
}
