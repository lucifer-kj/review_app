import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReviewLimitService, type GoogleBusinessSettings } from '@/services/reviewLimitService';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink, 
  Star, 
  MapPin, 
  AlertTriangle, 
  Settings,
  Copy,
  Check
} from 'lucide-react';

interface GoogleReviewLinkProps {
  tenantId: string;
  businessName?: string;
  className?: string;
}

export default function GoogleReviewLink({ tenantId, businessName, className }: GoogleReviewLinkProps) {
  const { toast } = useToast();
  const [googleSettings, setGoogleSettings] = useState<GoogleBusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadGoogleSettings();
  }, [tenantId]);

  const loadGoogleSettings = async () => {
    try {
      setLoading(true);
      const response = await ReviewLimitService.getGoogleBusinessSettings(tenantId);
      
      if (response.success && response.data) {
        setGoogleSettings(response.data);
      } else {
        console.error('Failed to load Google Business settings:', response.error);
      }
    } catch (error) {
      console.error('Error loading Google Business settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!googleSettings?.review_url) return;

    try {
      await navigator.clipboard.writeText(googleSettings.review_url);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Google review link copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleOpenReview = () => {
    if (googleSettings?.review_url) {
      window.open(googleSettings.review_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!googleSettings?.is_configured) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-yellow-500" />
            Google Reviews
          </CardTitle>
          <CardDescription>
            Set up Google Business Profile to enable review collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Google Business Profile Not Configured</div>
                <div className="text-sm">
                  To collect Google reviews, you need to set up your Google Business Profile URL in account settings.
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('/dashboard/settings', '_blank')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-yellow-500" />
          Google Reviews
        </CardTitle>
        <CardDescription>
          Direct customers to leave reviews on Google
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>Google Business Profile</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900">
              {businessName || 'Your Business'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {googleSettings.google_business_url}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Review Link</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-gray-50 rounded border text-sm font-mono text-gray-600 truncate">
              {googleSettings.review_url}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={copied}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleOpenReview}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Google Reviews
          </Button>
          <Button 
            variant="outline"
            onClick={handleCopyLink}
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div>• Share this link with customers to collect Google reviews</div>
          <div>• Reviews will appear on your Google Business Profile</div>
          <div>• Update your Google Business URL in settings if needed</div>
        </div>
      </CardContent>
    </Card>
  );
}
