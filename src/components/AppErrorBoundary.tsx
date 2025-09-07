import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { captureError } from '@/utils/sentry';
import { AuditLogService } from '@/services/auditLogService';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
}

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to audit system
    AuditLogService.logEvent(
      AuditLogService.ACTIONS.SYSTEM_ERROR,
      {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        component_name: this.props.componentName || 'AppErrorBoundary',
        error_id: this.state.errorId,
        url: window.location.href,
        user_agent: navigator.userAgent,
      }
    );

    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', this.state.errorId);
      console.groupEnd();
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      captureError(error, {
        component: this.props.componentName || 'AppErrorBoundary',
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    } catch (reportError) {
      // Silent fail for error reporting
      console.error('Failed to report error to Sentry:', reportError);
    }
  };

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoSettings = () => {
    window.location.href = '/settings';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                {this.props.componentName ? `${this.props.componentName} Error` : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {this.props.componentName 
                  ? `${this.props.componentName} encountered an error. Please try again or contact support if the problem persists.`
                  : 'We encountered an unexpected error. Please try refreshing the page.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="text-center text-sm text-muted-foreground">
                  Error ID: {this.state.errorId}
                </div>
              )}

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium text-sm mb-2">Error Details:</h4>
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                  <Button variant="outline" onClick={this.handleGoSettings} className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
              
              {/* Support contact */}
              <p className="text-xs text-muted-foreground text-center">
                Need help? Contact support at{" "}
                <a 
                  href="mailto:help@alphabusinessdigital.com" 
                  className="text-primary hover:underline"
                >
                  help@alphabusinessdigital.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
