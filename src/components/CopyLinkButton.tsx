import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface CopyLinkButtonProps {
  reviewUrl?: string;
}

export const CopyLinkButton = ({ 
  reviewUrl = `${window.location.origin}/review`
}: CopyLinkButtonProps) => {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      toast({
        title: "Link Copied!",
        description: "Review link has been copied to clipboard",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = reviewUrl;
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
