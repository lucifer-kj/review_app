import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, Send } from "lucide-react";

export const SendReviewEmailDialog = () => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [managerName, setManagerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter the recipient's email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-review-email', {
        body: { 
          recipientEmail: recipientEmail.trim(),
          managerName: managerName.trim() || "Alpha Business Designs"
        }
      });
      
      if (error) throw error;
      
      // Check if email was sent successfully
      if (data && data.id) {
        toast({
          title: "Review Email Sent! 🎉",
          description: `Embedded review form has been sent to ${recipientEmail}. The recipient can fill out the form directly in their email!`,
        });
      } else {
        throw new Error("Email sending failed - no response ID received");
      }
      
      setRecipientEmail("");
      setManagerName("");
      setOpen(false);
    } catch (error: any) {
      console.error("Email sending error:", error);
      toast({
        title: "Failed to Send Email",
        description: error.message || "There was an error sending the email. Please check your Resend API key configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Mail className="mr-2 h-4 w-4" />
          Send Review Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Review Request</DialogTitle>
          <DialogDescription>
            Send an embedded review form directly to your client's email. They can fill out the form without leaving their email client!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSendEmail}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Client Email Address *</Label>
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="client@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-name">Your Name/Business (Optional)</Label>
              <Input
                id="manager-name"
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Alpha Business Designs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Review Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};