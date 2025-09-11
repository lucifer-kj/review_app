import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthRedirect = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndRedirect = async () => {
      // Don't redirect if already on a protected route or if we've already checked
      if (hasChecked || location.pathname.startsWith('/master') || location.pathname.startsWith('/dashboard')) {
        setIsChecking(false);
        return;
      }
      
      try {
        setIsChecking(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          // User is authenticated - check their role and redirect accordingly
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, tenant_id')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            // Only redirect if not already on the correct page and not on login page
            if (profile.role === 'super_admin' && !location.pathname.startsWith('/master') && location.pathname !== '/') {
              console.log('Redirecting super admin to master dashboard');
              navigate("/master", { replace: true });
            } else if (['tenant_admin', 'user'].includes(profile.role) && !location.pathname.startsWith('/dashboard') && location.pathname !== '/') {
              console.log('Redirecting tenant user to dashboard');
              navigate("/dashboard", { replace: true });
            }
          }
        }
      } catch (error) {
        console.error('🔍 Auth Redirect - Error:', error);
        if (isMounted) {
          toast({
            title: "Authentication Error",
            description: "An error occurred while checking your access.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
          setHasChecked(true);
        }
      }
    };

    // Only run the check if we're on the login page or root, but not during login process
    if ((location.pathname === '/' || location.pathname === '/login') && !location.pathname.includes('authenticating')) {
      checkAuthAndRedirect();
    } else {
      setIsChecking(false);
      setHasChecked(true);
    }

    return () => {
      isMounted = false;
    };
  }, [navigate, toast, hasChecked, location.pathname]);

  return { isChecking, hasChecked };
};