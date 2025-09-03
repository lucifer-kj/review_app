import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ReviewService } from "@/services/reviewService";
import { Mail, Send, Loader2 } from "lucide-react";
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
      const result = await ReviewService.sendReviewEmail(
        formData.customerEmail.trim(),
        formData.customerName.trim(),
        {
          managerName: formData.managerName.trim() || undefined,
          businessName: formData.businessName.trim()
        }
      );

      if (result.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Review request sent to ${formData.customerName} at ${formData.customerEmail}`,
        });
        

        
        onSuccess?.();
        onOpenChange(false);
        
        // Reset form
        setFormData({
          customerName: "",
          customerEmail: "",
          managerName: "",
          businessName: "Alpha Business Designs"
        });
      } else {
        // Enhanced error handling with specific error codes
        const errorMessage = result.error || "Failed to send email";
        const errorCode = result.code || "UNKNOWN_ERROR";
        

        
        throw new Error(`${errorMessage} (Code: ${errorCode})`);
      }
    } catch (error) {
      
      // Enhanced error messages based on error type
      let errorTitle = "Failed to Send Email";
      let errorDescription = "Please try again";
      
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Parse error codes for better user feedback
        if (errorMessage.includes("RATE_LIMIT_EXCEEDED")) {
          errorTitle = "Too Many Requests";
          errorDescription = "Please wait a moment before trying again";
        } else if (errorMessage.includes("INVALID_EMAIL")) {
          errorTitle = "Invalid Email Address";
          errorDescription = "Please check the email address and try again";
        } else if (errorMessage.includes("NETWORK_ERROR")) {
          errorTitle = "Network Error";
          errorDescription = "Please check your connection and try again";
        } else if (errorMessage.includes("RESEND_API_ERROR")) {
          errorTitle = "Email Service Error";
          errorDescription = "Our email service is temporarily unavailable. Please try again later";
        } else if (errorMessage.includes("UNAUTHORIZED_ORIGIN")) {
          errorTitle = "Access Denied";
          errorDescription = "This action is not allowed from your current location";
        } else {
          errorDescription = errorMessage;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Review Request
          </DialogTitle>
          <DialogDescription>
            Send a personalized review request email to your customer. They'll receive a link to leave a review on your website.
          </DialogDescription>
        </DialogHeader>

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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Review Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
