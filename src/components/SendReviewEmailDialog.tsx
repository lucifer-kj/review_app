import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { EmailService } from "@/services/emailService";
import { Mail, Send, Loader2, Copy, ExternalLink } from "lucide-react";
import { VALIDATION } from "@/constants";

interface SendReviewEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: () => void;
}

export const SendReviewEmailDialog = ({
  open,
  onOpenChange,
  customerName = "",
  customerEmail = "",
  onSuccess
}: SendReviewEmailDialogProps) => {
  const [formData, setFormData] = useState({
    customerName: customerName,
    customerEmail: customerEmail,
    managerName: "",
    businessName: "Alpha Business Designs"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailGenerated, setEmailGenerated] = useState(false);
  const [emailData, setEmailData] = useState<{ to: string; subject: string; body: string } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the customer's name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.customerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter the customer's email address",
        variant: "destructive",
      });
      return;
    }

    // Email validation using standard regex
    if (!VALIDATION.EMAIL_REGEX.test(formData.customerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate email template
      const generatedEmailData = EmailService.generateReviewEmailTemplate({
        customerEmail: formData.customerEmail.trim(),
        customerName: formData.customerName.trim(),
        businessName: formData.businessName.trim(),
        managerName: formData.managerName.trim() || undefined
      });

      setEmailData(generatedEmailData);
      setEmailGenerated(true);

      toast({
        title: "Email Template Generated",
        description: `Email template prepared for ${formData.customerName}. Choose how you'd like to send it.`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate email template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEmailClient = () => {
    if (emailData) {
      EmailService.openEmailClient(emailData);
      toast({
        title: "Email Client Opened",
        description: "Your default email client should now open with the pre-filled email.",
      });
      
      onSuccess?.();
      handleClose();
    }
  };

  const handleCopyToClipboard = async () => {
    if (emailData) {
      const success = await EmailService.copyEmailToClipboard(emailData);
      if (success) {
        toast({
          title: "Email Copied",
          description: "Email content has been copied to your clipboard.",
        });
      } else {
        toast({
          title: "Copy Failed",
          description: "Failed to copy email to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmailGenerated(false);
      setEmailData(null);
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setEmailGenerated(false);
    setEmailData(null);
    setFormData({
      customerName: "",
      customerEmail: "",
      managerName: "",
      businessName: "Alpha Business Designs"
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Review Request
          </DialogTitle>
          <DialogDescription>
            {emailGenerated 
              ? "Email template generated! Choose how you'd like to send it."
              : "Create a personalized review request email for your customer."
            }
          </DialogDescription>
        </DialogHeader>

        {!emailGenerated ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter customer's full name"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="customer@example.com"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerName">Manager Name (Optional)</Label>
              <Input
                id="managerName"
                value={formData.managerName}
                onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                placeholder="Your name (will appear in email signature)"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Your business name"
                disabled={isSubmitting}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Generate Email Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Email Preview</h4>
              <div className="text-sm space-y-1">
                <p><strong>To:</strong> {emailData?.to}</p>
                <p><strong>Subject:</strong> {emailData?.subject}</p>
                <div className="mt-2">
                  <p><strong>Body:</strong></p>
                  <div className="bg-background p-3 rounded border text-xs max-h-32 overflow-y-auto">
                    {emailData?.body}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleOpenEmailClient}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Email Client
              </Button>
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                Create New Email
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
