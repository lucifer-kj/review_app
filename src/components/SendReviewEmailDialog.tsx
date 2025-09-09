import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { UnifiedEmailService } from "@/services/unifiedEmailService";
import { ReviewLimitService } from "@/services/reviewLimitService";
import { Mail, Send, Loader2, Copy, ExternalLink, CheckCircle, AlertCircle, AlertTriangle, Crown } from "lucide-react";
import { VALIDATION } from "@/constants";

interface SendReviewEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName?: string;
  customerEmail?: string;
  tenantId?: string;
  onSuccess?: () => void;
}

export const SendReviewEmailDialog = ({
  open,
  onOpenChange,
  customerName = "",
  customerEmail = "",
  tenantId,
  onSuccess
}: SendReviewEmailDialogProps) => {
  const [formData, setFormData] = useState({
    customerName: customerName,
    customerEmail: customerEmail,
    managerName: "",
    businessName: "Crux"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailGenerated, setEmailGenerated] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailData, setEmailData] = useState<{ to: string; subject: string; body: string; html?: string } | null>(null);
  const [sendingMethod, setSendingMethod] = useState<string>('auto');
  const [canSend, setCanSend] = useState(true);
  const [reviewLimits, setReviewLimits] = useState<any>(null);
  const { toast } = useToast();

  // Check review limits when dialog opens
  useEffect(() => {
    if (open && tenantId) {
      checkReviewLimits();
    }
  }, [open, tenantId]);

  const checkReviewLimits = async () => {
    try {
      const response = await ReviewLimitService.getTenantReviewLimits(tenantId!);
      if (response.success && response.data) {
        setReviewLimits(response.data);
        setCanSend(response.data.can_send);
        
        if (!response.data.can_send) {
          toast({
            title: "Review Sending Disabled",
            description: `You've reached your review limit (${response.data.max_reviews} reviews on ${response.data.plan_type} plan).`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error checking review limits:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if review sending is disabled due to plan limits
    if (tenantId && !canSend) {
      toast({
        title: "Review Sending Disabled",
        description: "You've reached your review limit. Upgrade your plan to continue sending review requests.",
        variant: "destructive",
      });
      return;
    }
    
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
      // Generate email template with dynamic business settings
      const generatedEmailData = await UnifiedEmailService.generateReviewEmailTemplate({
        customerEmail: formData.customerEmail.trim(),
        customerName: formData.customerName.trim(),
        businessName: formData.businessName.trim(),
        managerName: formData.managerName.trim() || undefined,
        tenantId: tenantId
      });

      setEmailData(generatedEmailData);
      setEmailGenerated(true);

      // Auto-send email if configured
      if (sendingMethod === 'auto') {
        await handleAutoSendEmail(generatedEmailData);
      } else {
        toast({
          title: "Email Template Generated",
          description: `Email template prepared for ${formData.customerName}. Choose how you'd like to send it.`,
        });
      }
      
    } catch (error) {
      console.error('Error generating email template:', error);
      toast({
        title: "Error",
        description: "Failed to generate email template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSendEmail = async (emailData: any) => {
    setIsSending(true);
    
    try {
      // Try to send via API first
      const result = await UnifiedEmailService.sendEmail(emailData);
      
      if (result.success) {
        setEmailSent(true);
        toast({
          title: "Email Sent Successfully!",
          description: `Review request email has been sent to ${formData.customerName} at ${formData.customerEmail}`,
        });
        onSuccess?.();
      } else {
        // Fallback to other methods
        await handleFallbackSending(emailData);
      }
    } catch (error) {
      console.error('Auto-send error:', error);
      await handleFallbackSending(emailData);
    } finally {
      setIsSending(false);
    }
  };

  const handleFallbackSending = async (emailData: any) => {
    // Try EmailJS if available
    if (UnifiedEmailService.isEmailJSConfigured()) {
      const result = await UnifiedEmailService.sendEmail(emailData);
      if (result.success) {
        setEmailSent(true);
        toast({
          title: "Email Sent Successfully!",
          description: `Review request email has been sent to ${formData.customerName}`,
        });
        onSuccess?.();
        return;
      }
    }

    // Fallback to mailto
    UnifiedEmailService.openEmailClient(emailData);
    toast({
      title: "Email Client Opened",
      description: "Please send the email manually from your email client.",
    });
  };

  const handleOpenEmailClient = () => {
    if (emailData) {
      UnifiedEmailService.openEmailClient(emailData);
      toast({
        title: "Email Client Opened",
        description: "Your default email client should open with the pre-filled email.",
      });
    }
  };

  const handleCopyToClipboard = async () => {
    if (emailData) {
      const success = await UnifiedEmailService.copyEmailToClipboard(emailData);
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

  const handleSendEmail = async () => {
    if (!emailData) return;
    
    setIsSending(true);
    try {
      const result = await UnifiedEmailService.sendEmail(emailData);
      
      if (result.success) {
        setEmailSent(true);
        toast({
          title: "Email Sent Successfully!",
          description: `Review request email has been sent to ${formData.customerName}`,
        });
        onSuccess?.();
      } else {
        toast({
          title: "Send Failed",
          description: result.error || "Failed to send email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customerName: customerName,
      customerEmail: customerEmail,
      managerName: "",
      businessName: "Crux"
    });
    setEmailGenerated(false);
    setEmailSent(false);
    setEmailData(null);
    setSendingMethod('auto');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Review Request Email
          </DialogTitle>
          <DialogDescription>
            Generate and send a personalized email template to request customer feedback.
          </DialogDescription>
        </DialogHeader>

        {/* Plan Limit Warning */}
        {tenantId && reviewLimits && !canSend && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Review Sending Disabled</div>
                <div className="text-sm">
                  You've reached your review limit of {reviewLimits.max_reviews} reviews 
                  on your {reviewLimits.plan_type} plan. Upgrade to continue sending review requests.
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm">Upgrade available for more capacity</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!emailGenerated ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer's full name"
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
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerName">Manager Name (Optional)</Label>
                <Input
                  id="managerName"
                  type="text"
                  value={formData.managerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                  placeholder="Who is requesting this review?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Your business name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sending Method</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="auto"
                    checked={sendingMethod === 'auto'}
                    onChange={(e) => setSendingMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Auto-send email</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="manual"
                    checked={sendingMethod === 'manual'}
                    onChange={(e) => setSendingMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Generate template only</span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isSending || (tenantId && !canSend)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : tenantId && !canSend ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Sending Disabled
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {sendingMethod === 'auto' ? 'Generate & Send' : 'Generate Email'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {emailSent && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800">Email Sent Successfully!</h4>
                    <p className="text-sm text-green-700">
                      Review request email has been sent to {formData.customerName} at {formData.customerEmail}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {emailData && (
              <>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">To:</div>
                    <div className="text-sm text-muted-foreground">{emailData.to}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Subject:</div>
                    <div className="text-sm text-muted-foreground">{emailData.subject}</div>
                  </div>
                </div>

                {/* Email Preview */}
                <div className="space-y-2">
                  <Label>Email Preview:</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-3 py-2 border-b">
                      <div className="text-xs font-medium text-muted-foreground">HTML Email Preview</div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {emailData.html ? (
                        <iframe
                          srcDoc={emailData.html}
                          className="w-full h-96 border-0"
                          title="Email Preview"
                        />
                      ) : (
                        <div className="p-4 whitespace-pre-wrap text-sm font-mono">
                          {emailData.body}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!emailSent && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleSendEmail} 
                      disabled={isSending}
                      className="flex-1"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Email Now
                        </>
                      )}
                    </Button>
                    <Button onClick={handleOpenEmailClient} variant="outline" className="flex-1">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Email Client
                    </Button>
                    <Button onClick={handleCopyToClipboard} variant="outline" className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleReset}>
                Send Another Email
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
