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

export const ProtectedRouteDebug = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        console.log('🔍 ProtectedRoute Debug - Fetching role for user:', user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log('🔍 ProtectedRoute Debug - Profile data:', profile);
        console.log('🔍 ProtectedRoute Debug - Profile error:', error);
        
        setUserRole(profile?.role || null);
        setDebugInfo({
          userId: user.id,
          userEmail: user.email,
          profileData: profile,
          profileError: error,
          requiredRole,
          hasAccess: checkRoleAccess(profile?.role || null, requiredRole || '')
        });
      } catch (error) {
        console.error('🔍 ProtectedRoute Debug - Error fetching user role:', error);
        setUserRole(null);
        setDebugInfo({
          userId: user.id,
          userEmail: user.email,
          error: error,
          requiredRole
        });
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user, requiredRole]);

  // Show loading spinner while checking authentication and role
  if (loading || roleLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('🔍 ProtectedRoute Debug - No user, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const hasAccess = checkRoleAccess(userRole, requiredRole);
    console.log('🔍 ProtectedRoute Debug - Access check:', {
      userRole,
      requiredRole,
      hasAccess,
      debugInfo
    });
    
    if (!hasAccess) {
      console.log('🔍 ProtectedRoute Debug - Access denied, redirecting to login');
      return <Navigate to="/" replace />;
    }
  }

  console.log('🔍 ProtectedRoute Debug - Access granted, rendering children');
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
