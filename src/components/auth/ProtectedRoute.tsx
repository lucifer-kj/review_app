import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthUser, useAuthLoading, useAuthProfile, useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RoleService } from '@/services/roleService';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'user' | ('super_admin' | 'tenant_admin' | 'user')[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  // Use Zustand stores instead of useAuth hook
  const user = useAuthUser();
  const loading = useAuthLoading();
  const profile = useAuthProfile();

  // Debug logging for production issues
  console.log('🔒 ProtectedRoute Debug:', {
    user: user ? 'present' : 'missing',
    loading,
    profile: profile ? { role: profile.role, tenant_id: profile.tenant_id } : 'missing',
    requiredRole,
    currentPath: window.location.pathname
  });

  // Role validation using existing profile from store
  const hasRequiredRole = () => {
    if (!requiredRole || !profile?.role) return true;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(profile.role);
  };

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('🔒 ProtectedRoute: Still loading...');
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('🔒 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // Check role permissions
  if (!hasRequiredRole()) {
    console.log('🔒 ProtectedRoute: Invalid role, redirecting to login');
    return <Navigate to="/" replace />;
  }

  console.log('🔒 ProtectedRoute: Access granted');
  return <>{children}</>;
};

// Role checking is now handled by RoleService for better security