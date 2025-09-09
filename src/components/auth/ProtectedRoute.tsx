import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RoleService } from '@/services/roleService';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'user' | ('super_admin' | 'tenant_admin' | 'user')[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Fetch user profile and role with role validation
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id, requiredRole],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // If required role is specified, validate access
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        let hasAccess = false;
        
        for (const role of roles) {
          const roleCheck = await RoleService.checkUserRole(user.id, role);
          if (roleCheck.data?.hasAccess) {
            hasAccess = true;
            break;
          }
        }
        
        if (!hasAccess) {
          throw new Error(`Access denied: Insufficient permissions. Required one of: ${roles.join(', ')}`);
        }
      }

      return data;
    },
    enabled: !!user?.id,
    retry: false, // Don't retry on access denied errors
  });

  // Show loading spinner while checking authentication and profile
  if (loading || profileLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If profile query failed due to access denied, redirect appropriately
  if (!profile) {
    // This will be handled by the error boundary or redirect logic
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Role checking is now handled by RoleService for better security