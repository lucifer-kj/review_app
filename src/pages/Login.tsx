import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Loader2, Mail, ArrowLeft } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";

interface LoginFormData {
  email: string;
  password: string;
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

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/"); // Redirect to root (dashboard)
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    checkUser();
  }, [navigate]);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Verification Email Sent",
          description: "Please check your email and click the verification link.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        navigate("/"); // Redirect to root (dashboard)
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


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md mx-auto shadow-lg border border-border">
        <CardHeader className="text-center px-8 pt-8 pb-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Building2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Crux</span>
          </div>
          <CardTitle className="text-xl mb-2">
            {showPasswordReset ? "Reset Password" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {showPasswordReset ? "Enter your email to reset password" :
             "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-6">
          {showPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
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
              {/* Invite-only authentication - signup disabled */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In to Your Account</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Access is by invitation only. If you don't have an account, please contact your administrator.
                </p>
                <p className="text-xs text-muted-foreground mt-3 font-medium">
                  Crux — Powered by Alpha Business Digital
                </p>
              </div>
              
              <TabsContent value="signin" className="space-y-6">
                {/* Email Sign In Form */}
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-3">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                      <Input
                      id="signin-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
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
                
                {/* Forgot Password */}
                <div className="text-center">
                <Button 
                  type="button" 
                    variant="link" 
                  onClick={() => setShowPasswordReset(true)}
                    className="text-sm"
                >
                    Forgot your password?
                </Button>
                </div>
                
                {/* Social Sign In */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full h-11" disabled>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </TabsContent>
            </>
          )}
        </CardContent>
        
        <CardFooter className="text-center px-8 pb-8">
          <p className="text-xs text-muted-foreground">
            Need help? Contact support at help@alphabusinessdigital.com
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
