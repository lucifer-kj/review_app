import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PublicReviewService } from '@/services/publicReviewService';

interface BusinessSettingsFormProps {
  tenantId: string;
  onSettingsUpdated?: () => void;
}

interface BusinessSettings {
  business_name: string;
  google_review_url: string;
  branding: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

export default function BusinessSettingsForm({ tenantId, onSettingsUpdated }: BusinessSettingsFormProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings>({
    business_name: '',
    google_review_url: '',
    branding: {
      logo_url: '',
      primary_color: '#3b82f6',
      secondary_color: '#ffffff'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingUrl, setGeneratingUrl] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string>('');
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    fetchCurrentSettings();
  }, [tenantId]);

  const fetchCurrentSettings = async () => {
    try {
      setLoading(true);
      const result = await PublicReviewService.checkTenantReviewSettings(tenantId);
      
      if (result.hasRequiredSettings) {
        setSettings({
          business_name: result.business_name || '',
          google_review_url: result.google_review_url || '',
          branding: {
            logo_url: '',
            primary_color: '#3b82f6',
            secondary_color: '#ffffff'
          }
        });
        setReviewUrl(result.review_url || '');
        setSlug(result.slug || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load current settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = () => {
    const errors: Record<string, string> = {};

    if (!settings.business_name.trim()) {
      errors.business_name = "Business name is required";
    } else if (settings.business_name.trim().length < 2) {
      errors.business_name = "Business name must be at least 2 characters";
    }

    if (!settings.google_review_url.trim()) {
      errors.google_review_url = "Google review URL is required";
    } else if (!validateGoogleUrl(settings.google_review_url)) {
      errors.google_review_url = "Please enter a valid Google Maps or Google search URL";
    }

    if (settings.branding.logo_url && !validateUrl(settings.branding.logo_url)) {
      errors.logo_url = "Please enter a valid URL for the logo";
    }

    if (settings.branding.primary_color && !validateColor(settings.branding.primary_color)) {
      errors.primary_color = "Please enter a valid hex color";
    }

    if (settings.branding.secondary_color && !validateColor(settings.branding.secondary_color)) {
      errors.secondary_color = "Please enter a valid hex color";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateGoogleUrl = (url: string) => {
    const googleUrlPattern = /^https:\/\/(www\.)?google\.com\/search\?.*q=.*|^https:\/\/(www\.)?maps\.google\.com\/.*|^https:\/\/g\.co\/.*|^https:\/\/goo\.gl\/.*/;
    return googleUrlPattern.test(url);
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateColor = (color: string) => {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBrandingChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [field]: value
      }
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSaveSettings = async () => {
    if (!validateSettings()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await PublicReviewService.updateTenantBusinessSettings(
        tenantId,
        settings.business_name,
        settings.google_review_url,
        settings.branding
      );

      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Your business settings have been updated successfully",
        });
        onSettingsUpdated?.();
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReviewUrl = async () => {
    if (!validateSettings()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before generating review URL",
        variant: "destructive",
      });
      return;
    }

    setGeneratingUrl(true);
    try {
      const result = await PublicReviewService.generateReviewUrl(
        tenantId,
        settings.business_name,
        settings.google_review_url,
        settings.branding
      );

      if (result.success) {
        setReviewUrl(result.review_url || '');
        setSlug(result.slug || '');
        toast({
          title: "Review URL Generated",
          description: "Your public review URL has been created successfully",
        });
        onSettingsUpdated?.();
      } else {
        throw new Error(result.error || 'Failed to generate review URL');
      }
    } catch (error) {
      console.error('Error generating review URL:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate review URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingUrl(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const hasRequiredSettings = settings.business_name.trim() && settings.google_review_url.trim();
  const canGenerateUrl = hasRequiredSettings && !reviewUrl;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Required Settings Alert */}
      {!hasRequiredSettings && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must provide a business name and Google review URL to generate your public review link.
          </AlertDescription>
        </Alert>
      )}

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Business Information
          </CardTitle>
          <CardDescription>
            Required information for your public review page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">
              Business Name *
            </Label>
            <Input
              id="business_name"
              value={settings.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              placeholder="Enter your business name"
              className={validationErrors.business_name ? 'border-red-500' : ''}
            />
            {validationErrors.business_name && (
              <p className="text-sm text-red-500">{validationErrors.business_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_review_url">
              Google Review URL *
            </Label>
            <Input
              id="google_review_url"
              value={settings.google_review_url}
              onChange={(e) => handleInputChange('google_review_url', e.target.value)}
              placeholder="https://maps.google.com/..."
              className={validationErrors.google_review_url ? 'border-red-500' : ''}
            />
            {validationErrors.google_review_url && (
              <p className="text-sm text-red-500">{validationErrors.google_review_url}</p>
            )}
            <p className="text-sm text-muted-foreground">
              This is where customers will be redirected for high ratings (4-5 stars)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Branding (Optional)
          </CardTitle>
          <CardDescription>
            Customize the appearance of your review page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={settings.branding.logo_url || ''}
              onChange={(e) => handleBrandingChange('logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
              className={validationErrors.logo_url ? 'border-red-500' : ''}
            />
            {validationErrors.logo_url && (
              <p className="text-sm text-red-500">{validationErrors.logo_url}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="primary_color"
                  value={settings.branding.primary_color || ''}
                  onChange={(e) => handleBrandingChange('primary_color', e.target.value)}
                  placeholder="#3b82f6"
                  className={validationErrors.primary_color ? 'border-red-500' : ''}
                />
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: settings.branding.primary_color || '#3b82f6' }}
                />
              </div>
              {validationErrors.primary_color && (
                <p className="text-sm text-red-500">{validationErrors.primary_color}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="secondary_color"
                  value={settings.branding.secondary_color || ''}
                  onChange={(e) => handleBrandingChange('secondary_color', e.target.value)}
                  placeholder="#ffffff"
                  className={validationErrors.secondary_color ? 'border-red-500' : ''}
                />
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: settings.branding.secondary_color || '#ffffff' }}
                />
              </div>
              {validationErrors.secondary_color && (
                <p className="text-sm text-red-500">{validationErrors.secondary_color}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review URL Section */}
      {reviewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Your Public Review URL
            </CardTitle>
            <CardDescription>
              Share this link with your customers to collect reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Review URL</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={reviewUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(reviewUrl, 'Review URL')}
                >
                  {copiedField === 'Review URL' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={slug}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(slug, 'Slug')}
                >
                  {copiedField === 'Slug' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => window.open(reviewUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Review Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handleSaveSettings}
          disabled={saving || !hasRequiredSettings}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>

        {canGenerateUrl && (
          <Button
            onClick={handleGenerateReviewUrl}
            disabled={generatingUrl || !hasRequiredSettings}
          >
            {generatingUrl ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating URL...
              </>
            ) : (
              'Generate Review URL'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
