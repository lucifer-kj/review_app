import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InvitationService } from "@/services/invitationService";

export default function InvitationAcceptance() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitationValid, setInvitationValid] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get token from URL parameters
  const token = searchParams.get('token');

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        toast({
          title: "Invalid Invitation",
          description: "No invitation token provided.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        const response = await InvitationService.getInvitationByToken(token);
        if (response.success && response.data) {
          setInvitationValid(true);
          setInvitationData(response.data);
          setFormData(prev => ({ ...prev, email: response.data!.email }));
        } else {
          toast({
            title: "Invalid Invitation",
            description: "This invitation is invalid or has expired.",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to validate invitation. Please try again.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setValidating(false);
      }
    };

    validateInvitation();
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Invalid Invitation",
        description: "No invitation token found.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await InvitationService.acceptInvitation({
        token: token,
        password: formData.password,
      });

      if (response.success) {
        toast({
          title: "Account Created Successfully!",
          description: "Your account has been created and you can now access the system.",
        });
        
        // Redirect based on role
        if (invitationData?.role === 'super_admin') {
          navigate("/master");
        } else if (invitationData?.role === 'tenant_admin') {
          navigate("/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Invitation acceptance error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md mx-auto shadow-lg border border-border">
          <CardContent className="px-8 py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md mx-auto shadow-lg border border-border">
          <CardContent className="px-8 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-4">
              This invitation is invalid or has expired.
            </p>
            <Button onClick={() => navigate("/")}>
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md mx-auto shadow-lg border border-border">
        <CardHeader className="text-center px-8 pt-8 pb-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Building2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Crux</span>
          </div>
          <CardTitle className="text-xl mb-2">
            Accept Invitation
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Complete your account setup for {invitationData?.role === 'super_admin' ? 'Super Admin' : 
                                           invitationData?.role === 'tenant_admin' ? 'Tenant Admin' : 'User'} access
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-11"
                disabled
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-11"
                placeholder="Enter a secure password (min 8 characters)"
                minLength={8}
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="h-11"
                placeholder="Confirm your password"
                minLength={8}
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Complete Setup
            </Button>
          </form>
        </CardContent>
        
        <CardContent className="text-center px-8 pb-8">
          <p className="text-xs text-muted-foreground">
            Need help? Contact support at help@alphabusinessdigital.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
