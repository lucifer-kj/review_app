import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { SHARE_CONFIG } from "@/constants";
import {
  Share2,
  Copy,
  MessageCircle,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  MessageSquare,
  Send, // Using Send instead of Telegram
} from "lucide-react";

interface ShareButtonProps {
  reviewUrl?: string;
  title?: string;
  description?: string;
}

export const ShareButton = ({ 
  reviewUrl = `${window.location.origin}/review`,
  title = SHARE_CONFIG.TITLE,
  description = SHARE_CONFIG.DESCRIPTION
}: ShareButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const shareText = `${title}\n\n${description}\n\n${reviewUrl}`;

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

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: reviewUrl,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast({
            title: "Share Error",
            description: "Failed to share. Please try again.",
            variant: "destructive",
          });
        }
      }
    } else {
      // Fallback to copy if Web Share API is not supported
      copyToClipboard();
    }
  };

  const shareViaSocial = (platform: string, url: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(shareText);
    
    let shareUrl = "";
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`;
        break;
      case "sms":
        shareUrl = `sms:?body=${encodedText}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const shareOptions = [
    ...(navigator.share ? [{
      name: "Share",
      icon: Share2,
      action: shareViaWebAPI,
      isWebShare: true,
    }] : []),
    {
      name: "WhatsApp",
      icon: MessageSquare,
      action: () => shareViaSocial("whatsapp", reviewUrl),
      isWebShare: false,
    },
    {
      name: "Telegram",
      icon: Send, // Using Send icon for Telegram
      action: () => shareViaSocial("telegram", reviewUrl),
      isWebShare: false,
    },
    {
      name: "SMS",
      icon: MessageCircle,
      action: () => shareViaSocial("sms", reviewUrl),
      isWebShare: false,
    },
    {
      name: "Email",
      icon: Mail,
      action: () => shareViaSocial("email", reviewUrl),
      isWebShare: false,
    },
    {
      name: "Facebook",
      icon: Facebook,
      action: () => shareViaSocial("facebook", reviewUrl),
      isWebShare: false,
    },
    {
      name: "Twitter",
      icon: Twitter,
      action: () => shareViaSocial("twitter", reviewUrl),
      isWebShare: false,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      action: () => shareViaSocial("linkedin", reviewUrl),
      isWebShare: false,
    },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {shareOptions.map((option, index) => (
          <DropdownMenuItem
            key={index}
            onClick={option.action}
            className="cursor-pointer"
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
