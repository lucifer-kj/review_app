import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface CopyLinkButtonProps {
  reviewUrl?: string;
  tenantId?: string;
}

export const CopyLinkButton = ({ 
  reviewUrl,
  tenantId
}: CopyLinkButtonProps) => {
  // Generate review URL with tenant_id if provided
  const defaultReviewUrl = tenantId 
    ? `${window.location.origin}/review/${tenantId}`
    : `${window.location.origin}/review`;
  
  const finalReviewUrl = reviewUrl || defaultReviewUrl;
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalReviewUrl);
      toast({
        title: "Link Copied!",
        description: "Review link has been copied to clipboard",
      });
    } catch (error) {
      // Fallback for older browsers
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
      className="gap-2"
    >
      <Copy className="h-4 w-4" />
      Copy Link
    </Button>
  );
};
