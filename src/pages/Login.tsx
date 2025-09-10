import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Shield, AlertTriangle, Key, Mail } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormData {
  email: string;
  password: string;
}

interface UserProfile {
  role: string;
  tenant_id: string | null;
}

const Login = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  // Signup disabled - invite-only authentication
  const [isSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth redirect hook to handle initial auth check
  const { isChecking } = useAuthRedirect();
  const { login } = useAuth();

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the useAuth login method
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Login successful, redirect will be handled by useAuth
        toast({
          title: "Login Successful",
          description: "Welcome to Crux!",
        });
      } else {
        throw new Error("Login failed. Please check your credentials.");
      }
        
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Authentication Error",
        description: authError.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      setShowPasswordReset(false);
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Reset Error",
        description: authError.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/` // Redirect to root
        }
      });
      
      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Google Sign In Error",
        description: authError.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };


  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center px-8 pt-8 pb-6">
          <div className="flex flex-col items-center mb-6">
            <img src="/web/icons8-logo-ios-17-outlined-120.png" alt="Crux Logo" className="w-16 h-16 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CRUX</h1>
            <p className="text-sm text-gray-600">Review Management Platform</p>
          </div>
          <CardTitle className="text-xl mb-2">
            {showPasswordReset ? "Reset Password" : "Manager Sign In"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {showPasswordReset ? "Enter your email to reset password" : "For platform managers and administrators only"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-6">
          {showPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Email
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowPasswordReset(false)}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
              
              <div className="text-center mt-4">
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm"
                >
                  Forgot password?
                </Button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/backup-login')}
                    disabled={loading}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Use Backup Login
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Alternative login method with email and password
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="text-center px-8 pb-8">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Users and tenants will receive magic links via email from their managers
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by Alpha Business Digital
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
