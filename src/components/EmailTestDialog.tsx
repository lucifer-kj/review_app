import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, FlaskConical } from "lucide-react";

export const EmailTestDialog = () => {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-review-email', {
        body: { 
          recipientEmail: testEmail.trim(),
          managerName: "Alpha Business Designs (Test)"
        }
      });
      
      if (error) throw error;
      
      if (data && data.id) {
        toast({
          title: "Test Email Sent! 🎉",
          description: `Test email with embedded form sent to ${testEmail}. Check your email to see the embedded review form!`,
        });
      } else {
        throw new Error("Email sending failed - no response ID received");
      }
      
      setTestEmail("");
      setOpen(false);
    } catch (error: any) {
      console.error("Test email error:", error);
      toast({
        title: "Failed to Send Test Email",
        description: error.message || "There was an error sending the test email. Please check your Resend API key configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlaskConical className="mr-2 h-4 w-4" />
          Test Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Test Email Functionality</DialogTitle>
          <DialogDescription>
            Send a test email with embedded review form to verify the functionality.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleTestEmail}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address *</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Test Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
