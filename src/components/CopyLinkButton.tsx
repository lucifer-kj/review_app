import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import type { BusinessSettings } from "@/services/businessSettingsService";

interface CopyLinkButtonProps {
  reviewUrl?: string;
  tenantId?: string;
  businessSettings?: BusinessSettings | null;
}

export const CopyLinkButton = ({
  reviewUrl,
  tenantId,
  businessSettings,
}: CopyLinkButtonProps) => {
  const isSettingsComplete = !!businessSettings?.google_business_url;

  const defaultReviewUrl = tenantId
    ? `${window.location.origin}/review/${tenantId}`
    : `${window.location.origin}/review`;

  const finalReviewUrl = reviewUrl || defaultReviewUrl;
  const { toast } = useToast();

  const copyToClipboard = async () => {
    if (!isSettingsComplete) {
      toast({
        title: "Setup Incomplete",
        description: "Please complete your business settings before copying the link.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(finalReviewUrl);
      toast({
        title: "Link Copied!",
        description: "Review link has been copied to clipboard",
      });
    } catch (error) {
      const textArea = document.createElement("textarea");
      textArea.value = finalReviewUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      toast({
        title: "Link Copied!",
        description: "Review link has been copied to clipboard",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyToClipboard}
      disabled={!isSettingsComplete}
      className="gap-2"
      title={
        !isSettingsComplete
          ? "Please complete your business settings to enable the review link."
          : "Copy review link"
      }
    >
      <Copy className="h-4 w-4" />
      Copy Link
    </Button>
  );
};
