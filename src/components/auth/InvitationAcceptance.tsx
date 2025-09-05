import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function InvitationAcceptance() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

    setLoading(true);

    try {
      // TODO: Implement invitation acceptance logic
      // This would typically involve:
      // 1. Validating the invitation token
      // 2. Creating the user account
      // 3. Setting the password
      // 4. Redirecting to appropriate dashboard

      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            Accept Invitation
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Complete your account setup
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
