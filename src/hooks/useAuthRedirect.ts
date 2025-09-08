import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthRedirect = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndRedirect = async () => {
      if (hasChecked) return; // Prevent multiple checks
      
      try {
        setIsChecking(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          // User is authenticated - navigate to master dashboard
          console.log('🔍 Auth Redirect - User authenticated, navigating to /master');
          navigate("/master", { replace: true });
        } else {
          // Check for test user in localStorage
          const storedTestUser = localStorage.getItem('crux_test_user');
          if (storedTestUser === 'true') {
            console.log('🔍 Auth Redirect - Test user found, navigating to /master');
            navigate("/master", { replace: true });
            return;
          }

          // Check for bypass user in localStorage
          const storedBypassUser = localStorage.getItem('crux_bypass_user');
          if (storedBypassUser === 'true') {
            console.log('🔍 Auth Redirect - Bypass user found, navigating to /master');
            navigate("/master", { replace: true });
            return;
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

    checkAuthAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [navigate, toast, hasChecked]);

  return { isChecking, hasChecked };
};
