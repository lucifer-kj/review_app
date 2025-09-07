import { AuditLogService } from "@/services/auditLogService";

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  category: 'database' | 'api' | 'frontend' | 'memory' | 'network';
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface PerformanceReport {
  id: string;
  timestamp: string;
  overall_score: number;
  metrics: PerformanceMetric[];
  recommendations: string[];
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  id: string;
  metric_id: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export class PerformanceMonitoringService {
  private static metrics: PerformanceMetric[] = [];
  private static alerts: PerformanceAlert[] = [];

  /**
   * Record a performance metric
   */
  static recordMetric(
    name: string,
    value: number,
    unit: string,
    category: PerformanceMetric['category'],
    threshold?: PerformanceMetric['threshold']
  ): void {
    const metric: PerformanceMetric = {
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
        this.createAlert(metric.id, 'critical', `${name} exceeded critical threshold: ${value}${unit}`);
      } else if (value >= threshold.warning) {
        this.createAlert(metric.id, 'warning', `${name} exceeded warning threshold: ${value}${unit}`);
      }
    }

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Create a performance alert
   */
  private static createAlert(metricId: string, severity: 'warning' | 'critical', message: string): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric_id: metricId,
      severity,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Log performance alert
    AuditLogService.logEvent(
      AuditLogService.ACTIONS.SYSTEM_ERROR,
      {
        alert_type: 'performance',
        severity,
        message,
        metric_id: metricId,
      }
    );
  }

  /**
   * Measure API response time
   */
  static async measureApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(
        `API Response Time - ${endpoint}`,
        duration,
        'ms',
        'api',
        {
          warning: 1000, // 1 second
          critical: 3000, // 3 seconds
        }
      );

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(
        `API Error Time - ${endpoint}`,
        duration,
        'ms',
        'api',
        {
          warning: 1000,
          critical: 3000,
        }
      );

      throw error;
    }
  }

  /**
   * Measure database query performance
   */
  static async measureDatabaseQuery<T>(
    query: () => Promise<T>,
    queryName: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await query();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(
        `Database Query - ${queryName}`,
        duration,
        'ms',
        'database',
        {
          warning: 500, // 500ms
          critical: 2000, // 2 seconds
        }
      );

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(
        `Database Error - ${queryName}`,
        duration,
        'ms',
        'database',
        {
          warning: 500,
          critical: 2000,
        }
      );

      throw error;
    }
  }

  /**
   * Measure frontend component render time
   */
  static measureComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric(
      `Component Render - ${componentName}`,
      renderTime,
      'ms',
      'frontend',
      {
        warning: 100, // 100ms
        critical: 500, // 500ms
      }
    );
  }

  /**
   * Monitor memory usage
   */
  static monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      this.recordMetric(
        'Memory Used',
        memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
        'MB',
        'memory',
        {
          warning: 50, // 50MB
          critical: 100, // 100MB
        }
      );

      this.recordMetric(
        'Memory Total',
        memory.totalJSHeapSize / 1024 / 1024, // Convert to MB
        'MB',
        'memory'
      );
    }
  }

  /**
   * Monitor network performance
   */
  static monitorNetworkPerformance(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection.effectiveType) {
        const speedMap: { [key: string]: number } = {
          'slow-2g': 1,
          '2g': 2,
          '3g': 3,
          '4g': 4,
        };

        this.recordMetric(
          'Network Speed',
          speedMap[connection.effectiveType] || 0,
          'level',
          'network'
        );
      }

      if (connection.downlink) {
        this.recordMetric(
          'Download Speed',
          connection.downlink,
          'Mbps',
          'network'
        );
      }
    }
  }

  /**
   * Get performance report
   */
  static getPerformanceReport(): PerformanceReport {
    const now = new Date().toISOString();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentMetrics = this.metrics.filter(
      metric => metric.timestamp >= last24Hours
    );

    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    
    const overall_score = this.calculatePerformanceScore(recentMetrics);
    const recommendations = this.generateRecommendations(recentMetrics, activeAlerts);

    return {
      id: `perf_report_${Date.now()}`,
      timestamp: now,
      overall_score,
      metrics: recentMetrics,
      recommendations,
      alerts: activeAlerts,
    };
  }

  /**
   * Calculate overall performance score
   */
  private static calculatePerformanceScore(metrics: PerformanceMetric[]): number {
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
   * Generate performance recommendations
   */
  private static generateRecommendations(
    metrics: PerformanceMetric[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow API calls
    const slowApiCalls = metrics.filter(
      m => m.category === 'api' && m.value > 1000
    );
    if (slowApiCalls.length > 0) {
      recommendations.push(`Optimize ${slowApiCalls.length} slow API endpoints (>1s response time)`);
    }

    // Check for slow database queries
    const slowDbQueries = metrics.filter(
      m => m.category === 'database' && m.value > 500
    );
    if (slowDbQueries.length > 0) {
      recommendations.push(`Optimize ${slowDbQueries.length} slow database queries (>500ms)`);
    }

    // Check for slow component renders
    const slowRenders = metrics.filter(
      m => m.category === 'frontend' && m.value > 100
    );
    if (slowRenders.length > 0) {
      recommendations.push(`Optimize ${slowRenders.length} slow component renders (>100ms)`);
    }

    // Check for high memory usage
    const highMemory = metrics.filter(
      m => m.category === 'memory' && m.name === 'Memory Used' && m.value > 50
    );
    if (highMemory.length > 0) {
      recommendations.push('Consider implementing memory optimization strategies');
    }

    // Check for critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push(`Address ${criticalAlerts.length} critical performance issues immediately`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges. Continue monitoring.');
    }

    return recommendations;
  }

  /**
   * Get metrics by category
   */
  static getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  /**
   * Get active alerts
   */
  static getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  static resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Clear old metrics and alerts
   */
  static cleanup(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
    
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Start performance monitoring
   */
  static startMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 30000);

    // Monitor network performance every 5 minutes
    setInterval(() => {
      this.monitorNetworkPerformance();
    }, 300000);

    // Cleanup old data every hour
    setInterval(() => {
      this.cleanup();
    }, 3600000);
  }
}
