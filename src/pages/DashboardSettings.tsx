import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { BusinessSettingsService } from "@/services/businessSettingsService";
import { TenantReviewFormService } from "@/services/tenantReviewFormService";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MobileSettings } from "@/components/MobileSettings";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { useAuthProfile, useIsAuthenticated } from "@/stores/authStore";
import { useCurrentTenantId, useIsTenantActive } from "@/stores/tenantStore";
import { 
  Settings, 
  Link, 
  Save, 
  Globe, 
  CheckCircle, 
  Building2,
  User,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Circle,
  Key,
  Eye,
  EyeOff,
  Palette,
  Mail,
  FormInput,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { ReviewFormPreview } from "@/components/ReviewFormPreview";
import type { BusinessSettings } from "@/types";

const DashboardSettings = () => {
  // Use Zustand stores instead of useAuth hook
  const profile = useAuthProfile();
  const isAuthenticated = useIsAuthenticated();
  const currentTenantId = useCurrentTenantId();
  const isTenantActive = useIsTenantActive();
  const [settings, setSettings] = useState<BusinessSettings>({
    id: '',
    user_id: '',
    google_business_url: '',
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    review_form_url: '',
    email_template: {
      subject: 'Share your experience with us',
      body: 'Hi {{customer_name}},\n\nWe hope you enjoyed your experience with us! We\'d love to hear your feedback.\n\nPlease take a moment to share your review: {{review_link}}\n\nThank you for choosing us!\n\nBest regards,\n{{business_name}}',
      footer: 'This email was sent by {{business_name}}. If you have any questions, please contact us at {{business_email}}.'
    },
    form_customization: {
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      logo_url: '',
      welcome_message: 'We\'d love to hear about your experience with our services',
      thank_you_message: 'Thank you for your feedback! Your review helps us improve our services.',
      required_fields: ['customer_name', 'rating'],
      optional_fields: ['customer_email', 'customer_phone', 'review_text']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isShareable, setIsShareable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkShareable = () => {
      const hasBusinessName = !!settings.business_name;
      const hasGoogleUrl = !!settings.google_business_url;
      const isGoogleUrlValid = validateUrl(settings.google_business_url || '');
      setIsShareable(hasBusinessName && hasGoogleUrl && isGoogleUrlValid);
    };
    checkShareable();
  }, [settings]);

  // Calculate setup completion
  const setupProgress = {
    businessName: !!settings.business_name,
    businessEmail: !!settings.business_email,
    businessPhone: !!settings.business_phone,
    businessAddress: !!settings.business_address,
    googleBusinessUrl: !!settings.google_business_url,
  };

  const completedSteps = Object.values(setupProgress).filter(Boolean).length;
  const totalSteps = Object.keys(setupProgress).length;
  const setupPercentage = Math.round((completedSteps / totalSteps) * 100);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  const validateSettings = () => {
    const errors: Record<string, string> = {};

    if (settings.business_name && settings.business_name.length < 2) {
      errors.business_name = "Business name must be at least 2 characters";
    }

    if (settings.business_email && !validateEmail(settings.business_email)) {
      errors.business_email = "Please enter a valid email address";
    }

    if (settings.google_business_url && !validateUrl(settings.google_business_url)) {
      errors.google_business_url = "Please enter a valid URL";
    }

    if (settings.review_form_url && !validateUrl(settings.review_form_url)) {
      errors.review_form_url = "Please enter a valid URL";
    }

    if (settings.form_customization?.primary_color && !validateColor(settings.form_customization.primary_color)) {
      errors.primary_color = "Please enter a valid hex color";
    }

    if (settings.form_customization?.secondary_color && !validateColor(settings.form_customization.secondary_color)) {
      errors.secondary_color = "Please enter a valid hex color";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Preview functions
  const generateEmailPreview = () => {
    const template = settings.email_template?.body || '';
    const subject = settings.email_template?.subject || '';
    
    return {
      subject: subject
        .replace(/\{\{customer_name\}\}/g, 'John Doe')
        .replace(/\{\{business_name\}\}/g, settings.business_name || 'Your Business')
        .replace(/\{\{business_email\}\}/g, settings.business_email || 'contact@business.com')
        .replace(/\{\{business_phone\}\}/g, settings.business_phone || '+1 (555) 123-4567'),
      body: template
        .replace(/\{\{customer_name\}\}/g, 'John Doe')
        .replace(/\{\{business_name\}\}/g, settings.business_name || 'Your Business')
        .replace(/\{\{review_link\}\}/g, settings.review_form_url || 'https://example.com/review')
        .replace(/\{\{business_email\}\}/g, settings.business_email || 'contact@business.com')
        .replace(/\{\{business_phone\}\}/g, settings.business_phone || '+1 (555) 123-4567')
    };
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

  const fetchSettings = useCallback(async () => {
    try {
      const response = await BusinessSettingsService.getSettings();
      
      if (response.success && response.data) {
        setSettings(response.data);
        if (response.data.business_name === null || response.data.business_name === '') {
          toast({
            title: "Settings Initialized",
            description: "Default settings created. You can now configure your business details.",
          });
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load settings. Using defaults.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async () => {
    // Validate settings before saving
    if (!validateSettings()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await BusinessSettingsService.updateSettings({
        google_business_url: settings.google_business_url || '',
        business_name: settings.business_name || '',
        business_email: settings.business_email || '',
        business_phone: settings.business_phone || '',
        business_address: settings.business_address || '',
        review_form_url: settings.review_form_url || '',
        email_template: settings.email_template,
        form_customization: settings.form_customization
      });
      
      if (response.success) {
        toast({
          title: "Settings Saved",
          description: "Your business settings have been updated successfully.",
        });
        setValidationErrors({});
        setShowPreview(true);
      } else {
        toast({
          title: "Save Failed",
          description: response.error || "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const validateGoogleBusinessUrl = (url: string) => {
    if (!url) return true;
    
    // More flexible regex that accepts various Google Business Profile URL formats
    const googleBusinessPatterns = [
      // Standard Google Maps business URL
      /^https:\/\/(www\.)?google\.com\/maps\/place\/[^\/]+\/@[^\/]+/,
      // Google Business Profile URL
      /^https:\/\/(www\.)?google\.com\/maps\/place\/[^\/]+\/data=[^\/]+/,
      // Alternative Google Business URL format
      /^https:\/\/(www\.)?google\.com\/maps\/place\/[^\/]+/,
      // Google My Business URL
      /^https:\/\/(www\.)?google\.com\/business\/[^\/]+/,
      // Google Maps with business ID
      /^https:\/\/(www\.)?google\.com\/maps\/.*\/place\/.*/
    ];
    
    return googleBusinessPatterns.some(pattern => pattern.test(url));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const setupSteps = [
    { label: "Business Name", completed: !!settings.business_name, field: 'business_name' as keyof BusinessSettings },
    { label: "Business Email", completed: !!settings.business_email, field: 'business_email' as keyof BusinessSettings },
    { label: "Business Phone", completed: !!settings.business_phone, field: 'business_phone' as keyof BusinessSettings },
    { label: "Business Address", completed: !!settings.business_address, field: 'business_address' as keyof BusinessSettings },
    { label: "Google Business URL", completed: !!settings.google_business_url, field: 'google_business_url' as keyof BusinessSettings },
  ];

  const handleSettingsChange = (field: keyof BusinessSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AppErrorBoundary componentName="DashboardSettings">
      <div className="w-full space-y-6 p-6 pt-20 lg:pt-6">
      {/* Mobile Settings */}
      <MobileSettings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onSave={handleSaveSettings}
        saving={saving}
        setupProgress={setupPercentage}
        setupSteps={setupSteps}
      />

      {/* Desktop Settings */}
      <div className="hidden lg:block space-y-6">
        <Breadcrumbs 
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Settings", isCurrent: true }
          ]} 
          className="mb-4"
        />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Configure your business settings and preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving || Object.keys(validationErrors).length > 0}
              size="lg"
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tenant Information Card */}
        {tenant && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                {tenant.name}
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </CardTitle>
              {tenant.settings?.description && (
                <CardDescription>{tenant.settings.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Your Role</span>
                  </div>
                  <p className="font-medium capitalize">{profile?.role?.replace('_', ' ')}</p>
                </div>
                {tenant.domain && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Domain</span>
                    </div>
                    <p className="font-medium">{tenant.domain}</p>
                  </div>
                )}
                {tenant.settings?.features && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Settings className="h-4 w-4" />
                      <span>Features</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tenant.settings.features.analytics && (
                        <Badge variant="outline" className="text-xs">Analytics</Badge>
                      )}
                      {tenant.settings.features.custom_domain && (
                        <Badge variant="outline" className="text-xs">Custom Domain</Badge>
                      )}
                      {tenant.settings.features.api_access && (
                        <Badge variant="outline" className="text-xs">API Access</Badge>
                      )}
                      {tenant.settings.features.priority_support && (
                        <Badge variant="outline" className="text-xs">Priority Support</Badge>
                      )}
                    </div>
                  </div>
                )}
                {tenant.settings?.limits && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Settings className="h-4 w-4" />
                      <span>Limits</span>
                    </div>
                    <div className="text-sm">
                      <p>Max Users: {tenant.settings.limits.max_users}</p>
                      <p>Max Reviews: {tenant.settings.limits.max_reviews}</p>
                      <p>Storage: {tenant.settings.limits.storage_limit} MB</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content with Tabs */}
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Business Info
            </TabsTrigger>
            <TabsTrigger value="review-form" className="flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              Review Form
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Setup Progress - Always visible */}
          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle2 className="h-5 w-5" />
                Setup Progress
              </CardTitle>
              <CardDescription className="text-sm">
                Complete your business profile to start collecting reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profile Completion</span>
                  <span className="text-sm text-muted-foreground">{completedSteps}/{totalSteps} steps</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${setupPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(setupProgress).map(([key, completed]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {completed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                      <span className={completed ? "text-foreground" : "text-muted-foreground"}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
                {setupPercentage === 100 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Setup Complete!</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">Your business profile is ready. You can now start sending review requests to customers.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Information Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card>
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Settings className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription className="text-sm">
              Update your business details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business-name" className="text-sm">Business Name</Label>
                <Input
                  id="business-name"
                  value={settings.business_name || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Crux"
                  className={`text-sm sm:text-base ${validationErrors.business_name ? 'border-red-500' : ''}`}
                />
                {validationErrors.business_name && (
                  <p className="text-sm text-red-500">{validationErrors.business_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-email" className="text-sm">Business Email</Label>
                <Input
                  id="business-email"
                  type="email"
                  value={settings.business_email || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, business_email: e.target.value }))}
                  placeholder="contact@alphabusiness.com"
                  className={`text-sm sm:text-base ${validationErrors.business_email ? 'border-red-500' : ''}`}
                />
                {validationErrors.business_email && (
                  <p className="text-sm text-red-500">{validationErrors.business_email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-phone" className="text-sm">Business Phone</Label>
                <Input
                  id="business-phone"
                  type="tel"
                  value={settings.business_phone || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, business_phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-address" className="text-sm">Business Address</Label>
                <Textarea
                  id="business-address"
                  value={settings.business_address || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, business_address: e.target.value }))}
                  placeholder="123 Business St, City, State 12345"
                  rows={3}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Business Integration */}
        <Card>
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Globe className="h-5 w-5" />
              Google Business Integration
            </CardTitle>
            <CardDescription className="text-sm">
              Configure your Google Business profile for review collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 sm:px-8">
            <div className="space-y-2">
              <Label htmlFor="google-business-url" className="text-sm">Google Business Profile URL</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="google-business-url"
                  value={settings.google_business_url || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, google_business_url: e.target.value }))}
                  placeholder="https://www.google.com/maps/place/Your-Business/@lat,lng,zoom/data=..."
                  className={`text-sm sm:text-base ${!validateGoogleBusinessUrl(settings.google_business_url || "") ? "border-destructive" : ""}`}
                />
                {settings.google_business_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(settings.google_business_url, '_blank')}
                    className="w-full sm:w-auto text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {settings.google_business_url && !validateGoogleBusinessUrl(settings.google_business_url) && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Please enter a valid Google Business Profile URL
                </div>
              )}
              {validateGoogleBusinessUrl(settings.google_business_url || "") && settings.google_business_url && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Valid Google Business Profile URL
                </div>
              )}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">How to get your Google Business Profile URL:</h4>
              <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Business</a></li>
                <li>Select your business profile</li>
                <li>Click on "View on Google Maps"</li>
                <li>Copy the URL from your browser's address bar</li>
              </ol>
            </div>
          </CardContent>
            </Card>
          </TabsContent>

          {/* Review Form Tab */}
          <TabsContent value="review-form" className="space-y-6">
            <Card>
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Globe className="h-5 w-5" />
              Review Form Customization
            </CardTitle>
            <CardDescription className="text-sm">
              Customize your review form appearance and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 sm:px-8">
            {/* Form Appearance */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm sm:text-base">Form Appearance</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color" className="text-sm">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={settings.form_customization?.primary_color || '#3b82f6'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        form_customization: {
                          ...prev.form_customization,
                          primary_color: e.target.value
                        }
                      }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.form_customization?.primary_color || '#3b82f6'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        form_customization: {
                          ...prev.form_customization,
                          primary_color: e.target.value
                        }
                      }))}
                      placeholder="#3b82f6"
                      className={`flex-1 ${validationErrors.primary_color ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {validationErrors.primary_color && (
                    <p className="text-sm text-red-500">{validationErrors.primary_color}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color" className="text-sm">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={settings.form_customization?.secondary_color || '#1e40af'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        form_customization: {
                          ...prev.form_customization,
                          secondary_color: e.target.value
                        }
                      }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.form_customization?.secondary_color || '#1e40af'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        form_customization: {
                          ...prev.form_customization,
                          secondary_color: e.target.value
                        }
                      }))}
                      placeholder="#1e40af"
                      className={`flex-1 ${validationErrors.secondary_color ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {validationErrors.secondary_color && (
                    <p className="text-sm text-red-500">{validationErrors.secondary_color}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome-message" className="text-sm">Welcome Message</Label>
                  <Input
                    id="welcome-message"
                    value={settings.form_customization?.welcome_message || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      form_customization: {
                        ...prev.form_customization,
                        welcome_message: e.target.value
                      }
                    }))}
                    placeholder="We'd love to hear about your experience with our services"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm sm:text-base">Form Fields</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Required Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['customer_name', 'customer_email', 'customer_phone', 'rating', 'review_text'].map(field => (
                      <label key={field} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={settings.form_customization?.required_fields?.includes(field) || false}
                          onChange={(e) => {
                            const currentFields = settings.form_customization?.required_fields || [];
                            const newFields = e.target.checked
                              ? [...currentFields, field]
                              : currentFields.filter(f => f !== field);
                            setSettings(prev => ({
                              ...prev,
                              form_customization: {
                                ...prev.form_customization,
                                required_fields: newFields
                              }
                            }));
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{field.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Optional Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['customer_email', 'customer_phone', 'review_text'].map(field => (
                      <label key={field} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={settings.form_customization?.optional_fields?.includes(field) || false}
                          onChange={(e) => {
                            const currentFields = settings.form_customization?.optional_fields || [];
                            const newFields = e.target.checked
                              ? [...currentFields, field]
                              : currentFields.filter(f => f !== field);
                            setSettings(prev => ({
                              ...prev,
                              form_customization: {
                                ...prev.form_customization,
                                optional_fields: newFields
                              }
                            }));
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{field.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Template */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm sm:text-base">Email Template</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email-subject" className="text-sm">Email Subject</Label>
                  <Input
                    id="email-subject"
                    value={settings.email_template?.subject || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email_template: {
                        ...prev.email_template,
                        subject: e.target.value
                      }
                    }))}
                    placeholder="Share your experience with us"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-body" className="text-sm">Email Body</Label>
                  <Textarea
                    id="email-body"
                    value={settings.email_template?.body || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email_template: {
                        ...prev.email_template,
                        body: e.target.value
                      }
                    }))}
                    placeholder="Hi {{customer_name}}, ..."
                    className="min-h-[120px] text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {`{{customer_name}}`}, {`{{business_name}}`}, {`{{review_link}}`}, {`{{business_email}}`}, {`{{business_phone}}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Review Form URL */}
            <div className="space-y-2">
              <Label htmlFor="review-form-url" className="text-sm">Your Unique Review Form URL</Label>
              <div className="flex gap-2">
                <Input
                  id="review-form-url"
                  readOnly
                  value={tenant ? TenantReviewFormService.getTenantReviewFormUrl(tenant.id) : ''}
                  className="text-sm sm:text-base bg-muted"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => tenant && copyToClipboard(TenantReviewFormService.getTenantReviewFormUrl(tenant.id), 'Review Form URL')}
                  disabled={!isShareable}
                >
                  {copiedField === 'Review Form URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {!isShareable && (
                <p className="text-xs text-yellow-600">
                  Please provide a business name and a valid Google Business URL to enable the copy link button.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Share this link with your customers to collect reviews.
              </p>
            </div>

            {showPreview && tenant && (
              <ReviewFormPreview settings={settings} tenantName={tenant.name} />
            )}
          </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader className="px-6 sm:px-8">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Mail className="h-5 w-5" />
                  Email Templates
                </CardTitle>
                <CardDescription className="text-sm">
                  Customize your email templates for review requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-6 sm:px-8">
                {/* Email Subject */}
                <div className="space-y-2">
                  <Label htmlFor="email-subject" className="text-sm font-medium">Email Subject</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email-subject"
                      value={settings.email_template?.subject || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email_template: {
                          ...prev.email_template,
                          subject: e.target.value
                        }
                      }))}
                      placeholder="Share your experience with us"
                      className="text-sm sm:text-base"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(settings.email_template?.subject || '', 'Subject')}
                    >
                      {copiedField === 'Subject' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {validationErrors.email_subject && (
                    <p className="text-sm text-red-500">{validationErrors.email_subject}</p>
                  )}
                </div>

                {/* Email Body */}
                <div className="space-y-2">
                  <Label htmlFor="email-body" className="text-sm font-medium">Email Body</Label>
                  <div className="space-y-2">
                    <Textarea
                      id="email-body"
                      value={settings.email_template?.body || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email_template: {
                          ...prev.email_template,
                          body: e.target.value
                        }
                      }))}
                      placeholder="Hi {{customer_name}}, ..."
                      className="min-h-[200px] text-sm sm:text-base font-mono"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Available variables: <code className="bg-muted px-1 rounded">{"{{customer_name}}"}</code>, <code className="bg-muted px-1 rounded">{"{{business_name}}"}</code>, <code className="bg-muted px-1 rounded">{"{{review_link}}"}</code>, <code className="bg-muted px-1 rounded">{"{{business_email}}"}</code>, <code className="bg-muted px-1 rounded">{"{{business_phone}}"}</code>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(settings.email_template?.body || '', 'Body')}
                      >
                        {copiedField === 'Body' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Email Footer */}
                <div className="space-y-2">
                  <Label htmlFor="email-footer" className="text-sm font-medium">Email Footer (Optional)</Label>
                  <Textarea
                    id="email-footer"
                    value={settings.email_template?.footer || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email_template: {
                        ...prev.email_template,
                        footer: e.target.value
                      }
                    }))}
                    placeholder="This email was sent by {{business_name}}..."
                    className="min-h-[100px] text-sm sm:text-base font-mono"
                  />
                </div>

                {/* Email Preview */}
                {showPreview && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email Preview</Label>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                          <p className="text-sm font-medium">{generateEmailPreview().subject}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Body:</span>
                          <div className="text-sm whitespace-pre-wrap font-mono bg-background p-3 rounded border">
                            {generateEmailPreview().body}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Key className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription className="text-sm">
              Manage your account password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-8">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Change Password</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Update your account password to keep your account secure.
                </p>
                <ChangePasswordDialog>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </ChangePasswordDialog>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2 text-sm sm:text-base text-blue-800">Tenant Login</h4>
                <p className="text-xs sm:text-sm text-blue-700 mb-2">
                  You can also sign in using your email and password instead of magic links.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/tenant-login', '_blank')}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Use Tenant Login
                </Button>
              </div>
            </div>
          </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </AppErrorBoundary>
  );
};

export default DashboardSettings;
