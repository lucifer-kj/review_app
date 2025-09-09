import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Key, User, Mail } from 'lucide-react';

interface UserPasswordManagerProps {
  userId: string;
  userEmail: string;
  userName: string;
  onPasswordChanged?: () => void;
}

export default function UserPasswordManager({ 
  userId, 
  userEmail, 
  userName, 
  onPasswordChanged 
}: UserPasswordManagerProps) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Update user password using admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Password Updated!",
        description: `Password has been successfully updated for ${userName}.`,
      });

      // Reset form
      setNewPassword('');
      setConfirmPassword('');
      
      // Notify parent component
      onPasswordChanged?.();

    } catch (error: any) {
      console.error('Password update error:', error);
      
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Change User Password
        </CardTitle>
        <CardDescription>
          Update the password for this user account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {userEmail}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                  className="pr-10"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                  className="pr-10"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
