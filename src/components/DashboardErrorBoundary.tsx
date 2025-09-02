import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `dashboard_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging
    console.error(`DashboardErrorBoundary caught an error in ${this.props.componentName}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Sentry.captureException(error, {
      //   extra: {
      //     component: this.props.componentName,
      //     componentStack: errorInfo.componentStack,
      //     errorId: this.state.errorId,
      //     url: window.location.href
      //   }
      // });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
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
        <div className="flex items-center justify-center p-8 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Dashboard Error</CardTitle>
              <CardDescription>
                {this.props.componentName} encountered an error. Please try again or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error ID for support */}
              <div className="text-center text-sm text-muted-foreground">
                Error ID: {this.state.errorId}
              </div>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-muted p-3">
                  <h4 className="font-medium text-sm mb-2">Error Details:</h4>
                  <p className="text-sm text-muted-foreground font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-muted-foreground mt-1 overflow-auto max-h-32">
                        {this.state.error.stack}
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
              <div className="text-center text-sm text-muted-foreground">
                Need help? Contact support at{" "}
                <a 
                  href="mailto:support@alphabusiness.com" 
                  className="text-primary hover:underline"
                >
                  support@alphabusiness.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use dashboard error boundary
export const useDashboardErrorBoundary = () => {
  const navigate = useNavigate();
  
  return {
    handleError: (error: Error, componentName: string, errorInfo?: ErrorInfo) => {
      console.error(`Error in ${componentName}:`, error, errorInfo);
      
      // Navigate to error page or show error modal
      navigate('/error', { 
        state: { 
          error: error.message,
          componentName,
          errorInfo: errorInfo?.componentStack,
          errorId: `dashboard_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      });
    }
  };
};
