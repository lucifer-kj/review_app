import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { InvitationService } from '../services/invitationService';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleInvitationCallback = async () => {
      try {
        console.log('Handling invitation callback...');
        
        // Get token from URL parameters
        const token = searchParams.get('token');
        if (!token) {
          setError('Invalid invitation link - no token found');
          setLoading(false);
          return;
        }

        // Validate invitation token
        const invitationResult = await InvitationService.getInvitationByToken(token);
        if (!invitationResult.success || !invitationResult.data) {
          setError(invitationResult.error || 'Invalid or expired invitation');
          setLoading(false);
          return;
        }

        const invitation = invitationResult.data;
        setEmail(invitation.email);
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('Existing session found');
          setLoading(false);
          return;
        }
        
      } catch (err) {
        console.error('Invitation callback error:', err);
        setError('Failed to process invitation');
      } finally {
        setLoading(false);
      }
    };

    handleInvitationCallback();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get token from URL parameters
      const token = searchParams.get('token');
      if (!token) {
        throw new Error('Invalid invitation token');
      }

      // Accept invitation and create user account
      const invitationResult = await InvitationService.acceptInvitation(token, password);
      if (!invitationResult.success) {
        throw new Error(invitationResult.error || 'Failed to accept invitation');
      }

      // Update user profile with full name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            email: user.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (profileError) {
          console.warn('Profile update error:', profileError);
          // Don't fail the entire process for this
        }
      }

      toast({
        title: "Account Setup Complete!",
        description: "Your account has been successfully set up. Welcome!",
      });

      // Redirect to appropriate dashboard based on role
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, tenant_id')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'super_admin') {
          navigate('/master');
        } else if (profile?.tenant_id) {
          navigate('/dashboard');
        } else {
          // User has no tenant assigned, show error
          toast({
            title: "Account Setup Incomplete",
            description: "Your account is not assigned to any business. Please contact support.",
            variant: "destructive"
          });
          return;
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Account setup error:', error);
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : 'Failed to set up account',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Processing invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Invitation Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Complete Your Account Setup</CardTitle>
            <CardDescription>
              You've been invited to join our platform. Please set up your password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This email was used for your invitation
                </p>
              </div>

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Setting up account...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
