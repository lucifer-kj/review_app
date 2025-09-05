/**
 * Centralized logging utility for Crux
 * Suppresses logs in production and provides structured logging in development
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  component?: string;
  userId?: string;
  tenantId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;

  private shouldLog(level: LogLevel): boolean {
    return this.isDevelopment || level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : undefined
      };
      console.error(this.formatMessage('ERROR', message, errorContext));
    }
  }

  // Performance logging
  performance(componentName: string, loadTime: number): void {
    if (this.isDevelopment) {
      this.info(`Performance: ${componentName} loaded in ${loadTime}ms`, {
        component: componentName,
        loadTime,
        action: 'component_load'
      });
    }
  }

  // User action logging
  userAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      action: 'user_action'
    });
  }

  // API logging
  apiCall(method: string, endpoint: string, status: number, duration?: number): void {
    this.info(`API ${method} ${endpoint} - ${status}`, {
      method,
      endpoint,
      status,
      duration,
      action: 'api_call'
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions for common use cases
export const logError = (message: string, error?: Error, context?: LogContext) => 
  logger.error(message, error, context);

export const logWarning = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

export const logPerformance = (componentName: string, loadTime: number) => 
  logger.performance(componentName, loadTime);

export const logUserAction = (action: string, context?: LogContext) => 
  logger.userAction(action, context);

export const logApiCall = (method: string, endpoint: string, status: number, duration?: number) => 
  logger.apiCall(method, endpoint, status, duration);
