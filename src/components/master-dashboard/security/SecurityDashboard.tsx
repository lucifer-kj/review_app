import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  RefreshCw,
  Download,
  Eye,
  Lock,
  Key,
  Database,
  Settings
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SecurityAuditService, SecurityAuditReport, SecurityCheck } from "@/services/securityAuditService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState } from "react";
import { toast } from "sonner";

export default function SecurityDashboard() {
  const queryClient = useQueryClient();
  const [selectedCheck, setSelectedCheck] = useState<SecurityCheck | null>(null);

  const { data: auditReport, isLoading, error } = useQuery({
    queryKey: ['security-audit'],
    queryFn: () => SecurityAuditService.runSecurityAudit(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const runAuditMutation = useMutation({
    mutationFn: () => SecurityAuditService.runSecurityAudit(),
    onSuccess: (newReport) => {
      queryClient.setQueryData(['security-audit'], newReport);
      toast.success("Security audit completed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to run security audit");
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pass': return 'default';
      case 'fail': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Key className="h-4 w-4" />;
      case 'authorization': return <Shield className="h-4 w-4" />;
      case 'data_protection': return <Database className="h-4 w-4" />;
      case 'network': return <Lock className="h-4 w-4" />;
      case 'configuration': return <Settings className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and audit system security
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
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and audit system security
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load security audit. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const report = auditReport!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and audit system security
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => runAuditMutation.mutate()}
            disabled={runAuditMutation.isPending}
          >
            {runAuditMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Run Audit
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Score Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{report.critical_issues}</div>
            <p className="text-xs text-muted-foreground">
              Immediate attention required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{report.high_issues}</div>
            <p className="text-xs text-muted-foreground">
              Priority fixes needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.checks.length}</div>
            <p className="text-xs text-muted-foreground">
              Security checks performed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
            <CardDescription>
              Action items to improve system security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="mt-1">
                    <Info className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Security Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Security Checks</CardTitle>
          <CardDescription>
            Detailed results of security audit checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.checks.map((check) => (
              <div 
                key={check.id} 
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedCheck(check)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getCategoryIcon(check.category)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{check.name}</h4>
                        <Badge variant={getSeverityBadgeVariant(check.severity)}>
                          {check.severity}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(check.status)}>
                          {check.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {check.description}
                      </p>
                      <p className="text-sm">
                        {check.details}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(check.severity)}
                    {getStatusIcon(check.status)}
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Check Details Modal */}
      {selectedCheck && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedCheck.name}</CardTitle>
                <CardDescription>{selectedCheck.description}</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedCheck(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Severity</h4>
                <Badge variant={getSeverityBadgeVariant(selectedCheck.severity)}>
                  {selectedCheck.severity}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <Badge variant={getStatusBadgeVariant(selectedCheck.status)}>
                  {selectedCheck.status}
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Details</h4>
              <p className="text-sm text-muted-foreground">
                {selectedCheck.details}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Recommendation</h4>
              <p className="text-sm text-muted-foreground">
                {selectedCheck.recommendation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
