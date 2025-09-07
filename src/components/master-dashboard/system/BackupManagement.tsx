import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Settings,
  Shield,
  FileText,
  Calendar,
  HardDrive
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BackupService, BackupConfig, BackupJob, DisasterRecoveryPlan } from "@/services/backupService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function BackupManagement() {
  const queryClient = useQueryClient();
  const [selectedConfig, setSelectedConfig] = useState<BackupConfig | null>(null);

  const { data: backupConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['backup-configs'],
    queryFn: () => Promise.resolve(BackupService.getBackupConfigs()),
    refetchInterval: 30000,
  });

  const { data: backupJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['backup-jobs'],
    queryFn: () => Promise.resolve(BackupService.getBackupJobs()),
    refetchInterval: 30000,
  });

  const { data: backupStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['backup-status'],
    queryFn: () => Promise.resolve(BackupService.getBackupStatus()),
    refetchInterval: 10000,
  });

  // Initialize backup service on component mount
  useEffect(() => {
    BackupService.initialize();
  }, []);

  const executeBackupMutation = useMutation({
    mutationFn: (configId: string) => BackupService.executeBackup(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['backup-status'] });
      toast.success("Backup completed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Backup failed");
    },
  });

  const testDRMutation = useMutation({
    mutationFn: (planId: string) => BackupService.testDisasterRecovery(planId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Disaster recovery test passed!");
      } else {
        toast.error(`DR test failed: ${result.issues.join(', ')}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "DR test failed");
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (configsLoading || jobsLoading || statusLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Backup Management</h2>
          <p className="text-muted-foreground">
            Manage database backups and disaster recovery
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Backup Management</h2>
          <p className="text-muted-foreground">
            Manage database backups and disaster recovery
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => executeBackupMutation.mutate('default-backup')}
            disabled={executeBackupMutation.isPending || backupStatus?.isRunning}
          >
            {executeBackupMutation.isPending ? (
              <Clock className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Backup Now
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Backup Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupStatus?.isRunning ? 'Running' : 'Idle'}
            </div>
            <p className="text-xs text-muted-foreground">
              {backupStatus?.isRunning ? 'Backup in progress' : 'Ready for backup'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupStatus?.lastBackup ? 
                new Date(backupStatus.lastBackup).toLocaleDateString() : 
                'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {backupStatus?.lastBackup ? 
                new Date(backupStatus.lastBackup).toLocaleTimeString() : 
                'No backups yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupStatus?.nextBackup ? 
                new Date(backupStatus.nextBackup).toLocaleDateString() : 
                'Not scheduled'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {backupStatus?.nextBackup ? 
                new Date(backupStatus.nextBackup).toLocaleTimeString() : 
                'Manual only'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupJobs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {backupJobs?.filter(job => job.status === 'completed').length || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Management Tabs */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">
            <FileText className="mr-2 h-4 w-4" />
            Backup Jobs ({backupJobs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="configs">
            <Settings className="mr-2 h-4 w-4" />
            Configurations ({backupConfigs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="disaster-recovery">
            <Shield className="mr-2 h-4 w-4" />
            Disaster Recovery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Jobs</CardTitle>
              <CardDescription>
                Recent backup job history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupJobs?.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Backup Jobs</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Run your first backup to see job history.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backupJobs?.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="font-medium">{job.metadata.config_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Started: {formatDate(job.started_at)}
                            </p>
                            {job.completed_at && (
                              <p className="text-sm text-muted-foreground">
                                Completed: {formatDate(job.completed_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusBadgeVariant(job.status)}>
                            {job.status}
                          </Badge>
                          {job.file_size && (
                            <span className="text-sm text-muted-foreground">
                              {formatFileSize(job.file_size)}
                            </span>
                          )}
                        </div>
                      </div>
                      {job.error_message && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{job.error_message}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Configurations</CardTitle>
              <CardDescription>
                Manage backup settings and schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupConfigs?.map((config) => (
                  <div key={config.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Schedule: {config.schedule} • Retention: {config.retention_days} days
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <HardDrive className="h-3 w-3" />
                            <span className="text-xs">
                              {config.include_data ? 'Data' : 'Schema only'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3" />
                            <span className="text-xs">
                              {config.encryption_enabled ? 'Encrypted' : 'Unencrypted'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => executeBackupMutation.mutate(config.id)}
                          disabled={executeBackupMutation.isPending || backupStatus?.isRunning}
                        >
                          <Play className="mr-2 h-3 w-3" />
                          Run Now
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disaster-recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disaster Recovery</CardTitle>
              <CardDescription>
                Test and manage disaster recovery procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recovery Time Objective</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">4 hours</div>
                      <p className="text-sm text-muted-foreground">
                        Maximum acceptable downtime
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recovery Point Objective</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-500">1 hour</div>
                      <p className="text-sm text-muted-foreground">
                        Maximum acceptable data loss
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Recovery Procedures</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Verify backup integrity</li>
                    <li>• Restore database from latest backup</li>
                    <li>• Update DNS records to point to backup server</li>
                    <li>• Notify stakeholders of recovery status</li>
                    <li>• Monitor system health post-recovery</li>
                  </ul>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => testDRMutation.mutate('default-dr-plan')}
                    disabled={testDRMutation.isPending}
                  >
                    {testDRMutation.isPending ? (
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="mr-2 h-4 w-4" />
                    )}
                    Test DR Procedures
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    View DR Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
