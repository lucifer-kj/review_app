import { AuditLogService } from "@/services/auditLogService";
import { PerformanceMonitoringService } from "./performanceMonitoringService";

export interface MonitoringAlert {
  id: string;
  type: 'system' | 'performance' | 'security' | 'business';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  metadata: Record<string, any>;
}

export interface MonitoringMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  category: 'system' | 'performance' | 'security' | 'business';
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface MonitoringDashboard {
  id: string;
  timestamp: string;
  system_health: number;
  active_alerts: number;
  metrics: MonitoringMetric[];
  alerts: MonitoringAlert[];
  uptime: number;
  response_time: number;
}

export class MonitoringService {
  private static alerts: MonitoringAlert[] = [];
  private static metrics: MonitoringMetric[] = [];
  private static isMonitoring = false;

  /**
   * Start comprehensive monitoring
   */
  static startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;

    // Start performance monitoring
    PerformanceMonitoringService.startMonitoring();

    // Monitor system health every 30 seconds
    setInterval(() => {
      this.monitorSystemHealth();
    }, 30000);

    // Monitor security events every minute
    setInterval(() => {
      this.monitorSecurityEvents();
    }, 60000);

    // Monitor business metrics every 5 minutes
    setInterval(() => {
      this.monitorBusinessMetrics();
    }, 300000);

    // Cleanup old data every hour
    setInterval(() => {
      this.cleanup();
    }, 3600000);

    // Log monitoring start
    AuditLogService.logEvent(
      AuditLogService.ACTIONS.SYSTEM_ERROR,
      {
        action: 'monitoring_started',
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring(): void {
    this.isMonitoring = false;
    
    AuditLogService.logEvent(
      AuditLogService.ACTIONS.SYSTEM_ERROR,
      {
        action: 'monitoring_stopped',
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Monitor system health
   */
  private static async monitorSystemHealth(): Promise<void> {
    try {
      // Check database connectivity
      const dbHealth = await this.checkDatabaseHealth();
      this.recordMetric('Database Health', dbHealth, 'status', 'system');

      // Check API responsiveness
      const apiHealth = await this.checkApiHealth();
      this.recordMetric('API Health', apiHealth, 'status', 'system');

      // Check memory usage
      const memoryUsage = this.getMemoryUsage();
      this.recordMetric('Memory Usage', memoryUsage, 'MB', 'system', {
        warning: 100,
        critical: 200,
      });

      // Check disk space (if available)
      const diskUsage = this.getDiskUsage();
      if (diskUsage !== null) {
        this.recordMetric('Disk Usage', diskUsage, '%', 'system', {
          warning: 80,
          critical: 90,
        });
      }

    } catch (error) {
      this.createAlert(
        'system',
        'critical',
        'System Health Check Failed',
        `Failed to monitor system health: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Monitor security events
   */
  private static async monitorSecurityEvents(): Promise<void> {
    try {
      // Check for failed login attempts
      const failedLogins = await this.getFailedLoginAttempts();
      if (failedLogins > 5) {
        this.createAlert(
          'security',
          'warning',
          'High Failed Login Attempts',
          `${failedLogins} failed login attempts detected in the last hour`,
          { failed_logins: failedLogins }
        );
      }

      // Check for suspicious activity
      const suspiciousActivity = await this.getSuspiciousActivity();
      if (suspiciousActivity.length > 0) {
        this.createAlert(
          'security',
          'critical',
          'Suspicious Activity Detected',
          `${suspiciousActivity.length} suspicious activities detected`,
          { activities: suspiciousActivity }
        );
      }

      // Record security metrics
      this.recordMetric('Failed Logins', failedLogins, 'count', 'security');
      this.recordMetric('Suspicious Activities', suspiciousActivity.length, 'count', 'security');

    } catch (error) {
      this.createAlert(
        'security',
        'critical',
        'Security Monitoring Failed',
        `Failed to monitor security events: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Monitor business metrics
   */
  private static async monitorBusinessMetrics(): Promise<void> {
    try {
      // Monitor user activity
      const activeUsers = await this.getActiveUsers();
      this.recordMetric('Active Users', activeUsers, 'count', 'business');

      // Monitor review submissions
      const reviewSubmissions = await this.getReviewSubmissions();
      this.recordMetric('Review Submissions', reviewSubmissions, 'count', 'business');

      // Monitor tenant activity
      const activeTenants = await this.getActiveTenants();
      this.recordMetric('Active Tenants', activeTenants, 'count', 'business');

      // Monitor system load
      const systemLoad = this.getSystemLoad();
      this.recordMetric('System Load', systemLoad, '%', 'business', {
        warning: 70,
        critical: 90,
      });

    } catch (error) {
      this.createAlert(
        'business',
        'warning',
        'Business Metrics Monitoring Failed',
        `Failed to monitor business metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Check database health
   */
  private static async checkDatabaseHealth(): Promise<number> {
    try {
      const startTime = performance.now();
      // This would typically be a simple database query
      // For now, simulate a health check
      await new Promise(resolve => setTimeout(resolve, 100));
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      return responseTime < 1000 ? 1 : 0; // 1 = healthy, 0 = unhealthy
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check API health
   */
  private static async checkApiHealth(): Promise<number> {
    try {
      const startTime = performance.now();
      // This would typically be a health check endpoint
      // For now, simulate an API health check
      await new Promise(resolve => setTimeout(resolve, 50));
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      return responseTime < 500 ? 1 : 0; // 1 = healthy, 0 = unhealthy
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get memory usage
   */
  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  /**
   * Get disk usage (simulated)
   */
  private static getDiskUsage(): number | null {
    // This would typically check actual disk usage
    // For now, return null to indicate it's not available
    return null;
  }

  /**
   * Get failed login attempts (simulated)
   */
  private static async getFailedLoginAttempts(): Promise<number> {
    // This would typically query the audit logs for failed login attempts
    // For now, return a simulated value
    return Math.floor(Math.random() * 10);
  }

  /**
   * Get suspicious activity (simulated)
   */
  private static async getSuspiciousActivity(): Promise<string[]> {
    // This would typically analyze audit logs for suspicious patterns
    // For now, return an empty array
    return [];
  }

  /**
   * Get active users (simulated)
   */
  private static async getActiveUsers(): Promise<number> {
    // This would typically query the database for active users
    // For now, return a simulated value
    return Math.floor(Math.random() * 100) + 50;
  }

  /**
   * Get review submissions (simulated)
   */
  private static async getReviewSubmissions(): Promise<number> {
    // This would typically query the database for recent review submissions
    // For now, return a simulated value
    return Math.floor(Math.random() * 20);
  }

  /**
   * Get active tenants (simulated)
   */
  private static async getActiveTenants(): Promise<number> {
    // This would typically query the database for active tenants
    // For now, return a simulated value
    return Math.floor(Math.random() * 10) + 5;
  }

  /**
   * Get system load (simulated)
   */
  private static getSystemLoad(): number {
    // This would typically get actual system load
    // For now, return a simulated value
    return Math.floor(Math.random() * 100);
  }

  /**
   * Record a monitoring metric
   */
  static recordMetric(
    name: string,
    value: number,
    unit: string,
    category: MonitoringMetric['category'],
    threshold?: MonitoringMetric['threshold']
  ): void {
    const metric: MonitoringMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      category,
      threshold,
    };

    this.metrics.push(metric);

    // Check thresholds and create alerts
    if (threshold) {
      if (value >= threshold.critical) {
        this.createAlert(
          category,
          'critical',
          `${name} Critical Threshold Exceeded`,
          `${name} has exceeded critical threshold: ${value}${unit}`,
          { metric: name, value, unit, threshold: threshold.critical }
        );
      } else if (value >= threshold.warning) {
        this.createAlert(
          category,
          'warning',
          `${name} Warning Threshold Exceeded`,
          `${name} has exceeded warning threshold: ${value}${unit}`,
          { metric: name, value, unit, threshold: threshold.warning }
        );
      }
    }

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Create a monitoring alert
   */
  static createAlert(
    type: MonitoringAlert['type'],
    severity: MonitoringAlert['severity'],
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): void {
    const alert: MonitoringAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata,
    };

    this.alerts.push(alert);

    // Log the alert
    AuditLogService.logEvent(
      AuditLogService.ACTIONS.SYSTEM_ERROR,
      {
        alert_type: type,
        severity,
        title,
        message,
        metadata,
      }
    );
  }

  /**
   * Get monitoring dashboard data
   */
  static getMonitoringDashboard(): MonitoringDashboard {
    const now = new Date().toISOString();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentMetrics = this.metrics.filter(
      metric => metric.timestamp >= last24Hours
    );

    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    
    const systemHealth = this.calculateSystemHealth(recentMetrics);
    const uptime = this.calculateUptime();
    const responseTime = this.calculateAverageResponseTime(recentMetrics);

    return {
      id: `dashboard_${Date.now()}`,
      timestamp: now,
      system_health: systemHealth,
      active_alerts: activeAlerts.length,
      metrics: recentMetrics,
      alerts: activeAlerts,
      uptime,
      response_time: responseTime,
    };
  }

  /**
   * Calculate system health score
   */
  private static calculateSystemHealth(metrics: MonitoringMetric[]): number {
    let score = 100;
    
    metrics.forEach(metric => {
      if (metric.threshold) {
        if (metric.value >= metric.threshold.critical) {
          score -= 20;
        } else if (metric.value >= metric.threshold.warning) {
          score -= 10;
        }
      }
    });

    return Math.max(0, score);
  }

  /**
   * Calculate uptime (simulated)
   */
  private static calculateUptime(): number {
    // This would typically calculate actual uptime
    // For now, return a simulated value
    return 99.9;
  }

  /**
   * Calculate average response time
   */
  private static calculateAverageResponseTime(metrics: MonitoringMetric[]): number {
    const responseTimeMetrics = metrics.filter(
      metric => metric.name.includes('Response Time') || metric.name.includes('Health')
    );

    if (responseTimeMetrics.length === 0) return 0;

    const total = responseTimeMetrics.reduce((sum, metric) => sum + metric.value, 0);
    return total / responseTimeMetrics.length;
  }

  /**
   * Resolve an alert
   */
  static resolveAlert(alertId: string, resolvedBy?: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolved_at = new Date().toISOString();
      alert.resolved_by = resolvedBy;
    }
  }

  /**
   * Get alerts by type
   */
  static getAlertsByType(type: MonitoringAlert['type']): MonitoringAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Get metrics by category
   */
  static getMetricsByCategory(category: MonitoringMetric['category']): MonitoringMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  /**
   * Cleanup old data
   */
  private static cleanup(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
    
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Get monitoring status
   */
  static getMonitoringStatus(): { isMonitoring: boolean; alertsCount: number; metricsCount: number } {
    return {
      isMonitoring: this.isMonitoring,
      alertsCount: this.alerts.length,
      metricsCount: this.metrics.length,
    };
  }
}
