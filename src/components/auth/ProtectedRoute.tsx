import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'user';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setUserRole(profile?.role || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Show loading spinner while checking authentication and role
  if (loading || roleLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const hasAccess = checkRoleAccess(userRole, requiredRole);
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

const checkRoleAccess = (userRole: string | null, requiredRole: string): boolean => {
  if (!userRole) return false;

  // Super admin has access to everything
  if (userRole === 'super_admin') return true;

  // Legacy admin role has access to everything (for backward compatibility)
  if (userRole === 'admin') return true;

  // Tenant admin has access to tenant_admin and user routes
  if (userRole === 'tenant_admin') {
    return requiredRole === 'tenant_admin' || requiredRole === 'user';
  }

  // Regular user only has access to user routes
  if (userRole === 'user') {
    return requiredRole === 'user';
  }

  return false;
};
