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
          // User is authenticated, check their role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          console.log('🔍 Auth Redirect - Profile check:', {
            userId: session.user.id,
            userEmail: session.user.email,
            profileRole: profile?.role,
            hasAccess: profile?.role === 'super_admin' || profile?.role === 'tenant_admin' || profile?.role === 'admin'
          });

          if (profile?.role === 'super_admin' || profile?.role === 'tenant_admin' || profile?.role === 'admin') {
            console.log('🔍 Auth Redirect - Access granted, navigating to /master');
            navigate("/master", { replace: true });
          } else {
            console.log('🔍 Auth Redirect - Access denied, signing out');
            await supabase.auth.signOut();
            toast({
              title: "Access Denied",
              description: "Only managers can access this system.",
              variant: "destructive",
            });
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
