import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useMagicLinkHandler() {
  const [isHandling, setIsHandling] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        setIsHandling(true);

        // Get the current URL and check for auth parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        // Only handle magic link completion
        if (type === 'magiclink' && accessToken && refreshToken) {
          console.log('Magic link detected, setting session...');

          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            toast({
              title: "Authentication Error",
              description: error.message,
              variant: "destructive",
            });
            return;
          }

          if (data.user) {
            console.log('Magic link authentication successful:', data.user.email);
            
            // Check if user has a profile, if not, create one
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // Profile doesn't exist, create one
              console.log('Creating profile for new user...');
              const { error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: data.user.email || '',
                  full_name: data.user.user_metadata?.full_name || '',
                  role: 'user', // Default role for magic link users
                  tenant_id: null, // Will be assigned later by super admin
                });

              if (createError) {
                console.error('Error creating profile:', createError);
                toast({
                  title: "Profile Creation Error",
                  description: createError.message,
                  variant: "destructive",
                });
                return;
              }
            }

            // Verify user has a valid role
            if (profile && profile.role && !['super_admin', 'tenant_admin', 'user'].includes(profile.role)) {
              console.error('Invalid user role:', profile.role);
              toast({
                title: "Access Denied",
                description: "Invalid user role. Please contact support.",
                variant: "destructive",
              });
              return;
            }

            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);

            // Show success message
            toast({
              title: "Welcome!",
              description: "You've been signed in successfully.",
            });

            // Navigate based on user role
            if (profile?.role === 'super_admin') {
              navigate('/master');
            } else if (profile?.role === 'tenant_admin' || profile?.role === 'user') {
              navigate('/dashboard');
            } else {
              // Default fallback - redirect to login if no valid role
              navigate('/login');
            }
          }
        }
      } catch (error) {
        console.error('Magic link handler error:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to complete sign in. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsHandling(false);
      }
    };

    // Run the handler when the component mounts
    handleMagicLink();
  }, [navigate, toast]);

  return { isHandling };
}
