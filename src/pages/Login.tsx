import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Loader2, Phone, Mail, ArrowLeft } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";

interface LoginFormData {
  phone: string;
  email: string;
  password: string;
  verificationCode: string;
}

const Login = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    phone: "",
    email: "",
    password: "",
    verificationCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [signupMethod, setSignupMethod] = useState<'phone' | 'email'>('phone');
  const [verificationAttempts, setVerificationAttempts] = useState(0);
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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          phone: formData.phone,
          password: formData.password,
        });
        
        if (error) throw error;
        
        setShowVerification(true);
        setVerificationAttempts(0);
        toast({
          title: "Verification Code Sent",
          description: "Please check your SMS for the verification code.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          phone: formData.phone,
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

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prevent too many verification attempts
      if (verificationAttempts >= 3) {
        toast({
          title: "Too Many Attempts",
          description: "Please request a new verification code.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        phone: formData.phone,
        token: formData.verificationCode,
        type: 'sms'
      });
      
      if (error) throw error;
      
      navigate("/"); // Redirect to root (dashboard)
    } catch (error) {
      const authError = error as AuthError;
      setVerificationAttempts(prev => prev + 1);
      toast({
        title: "Verification Error",
        description: authError.message || "Invalid verification code",
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

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        phone: formData.phone,
        password: formData.password,
      });
      
      if (error) throw error;
      
      setVerificationAttempts(0);
      toast({
        title: "Verification Code Resent",
        description: "A new verification code has been sent to your phone.",
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Resend Error",
        description: authError.message || "Failed to resend verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="text-lg sm:text-xl font-bold">Alpha Business</span>
          </div>
          <CardTitle className="text-lg sm:text-xl">
            {showVerification ? "Verify Phone Number" : 
             showPasswordReset ? "Reset Password" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-sm">
            {showVerification ? "Enter the code sent to your phone" :
             showPasswordReset ? "Enter your email to reset password" :
             "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          {showVerification ? (
            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={formData.verificationCode}
                  onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Sign In
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleResendVerification}
                disabled={loading}
              >
                Resend Code
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setShowVerification(false);
                  handleInputChange('verificationCode', "");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign Up
              </Button>
            </form>
          ) : showPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setShowPasswordReset(false);
                  handleInputChange('email', "");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </form>
          ) : (
            <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-6">
                <div className="space-y-4">
                  {/* Sign-in Method Selection */}
                  <div className="space-y-2">
                    <Label>Sign in with</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={signupMethod === 'phone' ? 'default' : 'outline'}
                        onClick={() => setSignupMethod('phone')}
                        className="w-full"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Phone
                      </Button>
                      <Button
                        type="button"
                        variant={signupMethod === 'email' ? 'default' : 'outline'}
                        onClick={() => setSignupMethod('email')}
                        className="w-full"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </Button>
                    </div>
                  </div>

                  {/* Phone Sign-in Form */}
                  {signupMethod === 'phone' && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Phone className="mr-2 h-4 w-4" />
                        Sign In with Phone
                      </Button>
                    </form>
                  )}

                  {/* Email Sign-in Form */}
                  {signupMethod === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-email">Password</Label>
                        <Input
                          id="password-email"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Mail className="mr-2 h-4 w-4" />
                        Sign In with Email
                      </Button>
                    </form>
                  )}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowPasswordReset(true)}
                  >
                    Reset Password
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                  >
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
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6">
                <div className="space-y-4">
                  {/* Signup Method Selection */}
                  <div className="space-y-2">
                    <Label>Sign up with</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={signupMethod === 'phone' ? 'default' : 'outline'}
                        onClick={() => setSignupMethod('phone')}
                        className="w-full"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Phone
                      </Button>
                      <Button
                        type="button"
                        variant={signupMethod === 'email' ? 'default' : 'outline'}
                        onClick={() => setSignupMethod('email')}
                        className="w-full"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </Button>
                    </div>
                  </div>

                  {/* Phone Signup Form */}
                  {signupMethod === 'phone' && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Phone Number</Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Phone className="mr-2 h-4 w-4" />
                        Create Account with Phone
                      </Button>
                    </form>
                  )}

                  {/* Email Signup Form */}
                  {signupMethod === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email Address</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password-email">Password</Label>
                        <Input
                          id="signup-password-email"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Mail className="mr-2 h-4 w-4" />
                        Create Account with Email
                      </Button>
                    </form>
                  )}

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google Signup */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                  >
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
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        
        <CardFooter className="text-center px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Need help? Contact support at help@alphabusiness.com
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;