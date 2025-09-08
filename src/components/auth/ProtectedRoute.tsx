import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'user';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Fetch user profile and role
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Show loading spinner while checking authentication and profile
  if (loading || profileLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check role permissions
  if (requiredRole && profile) {
    const userRole = profile.role;
    const hasAccess = checkRoleAccess(userRole, requiredRole);

    if (!hasAccess) {
      // Redirect based on user role
      if (userRole === 'super_admin') {
        return <Navigate to="/master" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

// Role checking function
const checkRoleAccess = (userRole: string | null, requiredRole: string): boolean => {
  if (!userRole) return false;

  // Super admin has access to everything
  if (userRole === 'super_admin') return true;

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