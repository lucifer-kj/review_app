import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTenantContext } from '@/hooks/useTenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'user';
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'user',
  fallback 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, isTenantAdmin, loading: tenantLoading } = useTenantContext();
  const location = useLocation();

  // Show loading state while checking authentication
  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking permissions...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  const hasRequiredRole = (() => {
    switch (requiredRole) {
      case 'super_admin':
        return isSuperAdmin;
      case 'tenant_admin':
        return isSuperAdmin || isTenantAdmin;
      case 'user':
        return true; // All authenticated users
      default:
        return false;
    }
  })();

  // Show access denied if user doesn't have required role
  if (!hasRequiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Access Denied</span>
            </CardTitle>
            <CardDescription>
              You don't have permission to access this resource
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Required role: <span className="font-medium">{requiredRole}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Your role: <span className="font-medium">
                  {isSuperAdmin ? 'super_admin' : isTenantAdmin ? 'tenant_admin' : 'user'}
                </span>
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button asChild>
                <a href="/dashboard">
                  <Shield className="h-4 w-4 mr-2" />
                  Dashboard
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for specific role requirements
export function SuperAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="super_admin">
      {children}
    </ProtectedRoute>
  );
}

export function TenantAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="tenant_admin">
      {children}
    </ProtectedRoute>
  );
}

export function UserRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user">
      {children}
    </ProtectedRoute>
  );
}
