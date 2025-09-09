import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling auth callback...');
        
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          return;
        }

        if (data.session) {
          console.log('Session found, user:', data.session.user.email);
          
          // Check if this is an invitation
          const type = searchParams.get('type');
          
          if (type === 'invite') {
            console.log('Invitation callback detected, redirecting to dashboard');
            // Redirect to dashboard for invited users
            navigate('/dashboard');
          } else {
            // Redirect based on user role
            console.log('Checking user role...');
            
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role, tenant_id')
              .eq('id', data.session.user.id)
              .single();

            if (profileError) {
              console.error('Profile fetch error:', profileError);
              setError('Failed to load user profile');
              return;
            }

            console.log('User profile:', profile);

            if (profile?.role === 'super_admin') {
              console.log('Super admin detected, redirecting to master dashboard');
              navigate('/master');
            } else if (profile?.role === 'tenant_admin' || profile?.role === 'user') {
              console.log('Regular user detected, redirecting to dashboard');
              navigate('/dashboard');
            } else {
              console.log('Unknown role, redirecting to dashboard');
              navigate('/dashboard');
            }
          }
        } else {
          console.log('No session found, redirecting to login');
          setError('No session found');
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
