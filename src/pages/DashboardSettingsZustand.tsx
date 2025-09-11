import { useState, useEffect, useCallback, useRef } from "react";
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
import { 
  Settings, 
  Link, 
  Save, 
  Globe, 
  Mail,
  Building2,
  User,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw
} from "lucide-react";
import type { BusinessSettings } from "@/services/businessSettingsService";

// Import Zustand stores instead of useAuth hook
import { useCurrentTenant, useCurrentTenantId, useIsTenantActive } from "@/stores/tenantStore";
import { useAuthProfile, useIsAuthenticated } from "@/stores/authStore";

interface ValidationErrors {
  [key: string]: string;
}

const DashboardSettingsZustand = () => {
  // Use Zustand stores instead of useAuth hook
  const currentTenant = useCurrentTenant();
  const currentTenantId = useCurrentTenantId();
  const isTenantActive = useIsTenantActive();
  const profile = useAuthProfile();
  const isAuthenticated = useIsAuthenticated();
  
  const { toast } = useToast();
  
  // State management
  const [settings, setSettings] = useState<BusinessSettings>({
    id: '',
    user_id: '',
    tenant_id: '',
    google_business_url: '',
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    email_template: {
      subject: '',
      body: '',
      footer: ''
    },
    form_customization: {
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      welcome_message: '',
      thank_you_message: '',
      required_fields: [],
      optional_fields: []
    },
    created_at: '',
    updated_at: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSaveAttempt, setLastSaveAttempt] = useState<Date | null>(null);
  
  // Refs for timeout management
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const MAX_RETRY_ATTEMPTS = 3;
  const SAVE_TIMEOUT = 30000; // 30 seconds
  const LOADING_TIMEOUT = 15000; // 15 seconds

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
    const errors: ValidationErrors = {};

    if (settings.business_name && settings.business_name.length < 2) {
      errors.business_name = "Business name must be at least 2 characters";
    }

    if (settings.business_email && !validateEmail(settings.business_email)) {
      errors.business_email = "Please enter a valid email address";
    }

    if (settings.google_business_url && !validateUrl(settings.google_business_url)) {
      errors.google_business_url = "Please enter a valid URL";
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

  // Fetch settings with timeout and retry logic
  const fetchSettings = useCallback(async (retryAttempt = 0): Promise<void> => {
    if (!currentTenantId) {
      console.error('No tenant context available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Set loading timeout
      loadingTimeoutRef.current = setTimeout(() => {
        if (loading) {
          console.warn('Settings loading timeout reached');
          setLoading(false);
          toast({
            title: "Loading Timeout",
            description: "Settings are taking longer than expected. Please refresh the page.",
            variant: "destructive",
          });
        }
      }, LOADING_TIMEOUT);

      const response = await BusinessSettingsService.getBusinessSettings();
      
      // Clear timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      if (response.success && response.data) {
        setSettings(response.data);
        setValidationErrors({});
        
        if (retryAttempt > 0) {
          toast({
            title: "Settings Loaded",
            description: "Settings have been successfully loaded.",
          });
        }
      } else {
        // Try to create default settings if none exist
        if (retryAttempt === 0) {
          console.log('No settings found, creating defaults...');
          const defaultResponse = await BusinessSettingsService.createDefaultSettings();
          
          if (defaultResponse.success && defaultResponse.data) {
            setSettings(defaultResponse.data);
            toast({
              title: "Settings Initialized",
              description: "Default settings created. You can now configure your business details.",
            });
          } else {
            throw new Error(defaultResponse.error || 'Failed to create default settings');
          }
        } else {
          throw new Error(response.error || 'Failed to load settings');
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying settings fetch (attempt ${retryAttempt + 1})...`);
        setTimeout(() => fetchSettings(retryAttempt + 1), 2000 * (retryAttempt + 1));
      } else {
        toast({
          title: "Error",
          description: "Failed to load settings after multiple attempts. Please refresh the page.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [currentTenantId, toast]);

  // Save settings with timeout and retry logic
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

    // Prevent multiple simultaneous saves
    if (saving) {
      toast({
        title: "Save in Progress",
        description: "Please wait for the current save operation to complete.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setLastSaveAttempt(new Date());
    
    try {
      // Set save timeout
      saveTimeoutRef.current = setTimeout(() => {
        if (saving) {
          console.warn('Save operation timeout reached');
          setSaving(false);
          toast({
            title: "Save Timeout",
            description: "Save operation timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, SAVE_TIMEOUT);

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
      
      // Clear timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      if (response.success) {
        setSettings(response.data!);
        setValidationErrors({});
        setRetryCount(0);
        setShowPreview(true);
        
        toast({
          title: "Settings Saved",
          description: "Your business settings have been updated successfully.",
        });
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (error: unknown) {
      console.error('Save error:', error);
      
      // Clear timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        setRetryCount(prev => prev + 1);
        toast({
          title: "Save Failed - Retrying",
          description: `Attempt ${retryCount + 1} failed. Retrying... (${errorMessage})`,
          variant: "destructive",
        });
        
        // Retry after delay
        setTimeout(() => {
          setSaving(false);
          handleSaveSettings();
        }, 2000 * (retryCount + 1));
      } else {
        toast({
          title: "Save Failed",
          description: `Failed to save settings after ${MAX_RETRY_ATTEMPTS} attempts: ${errorMessage}`,
          variant: "destructive",
        });
        setRetryCount(0);
      }
    } finally {
      setSaving(false);
    }
  };

  // Initialize settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Handle retry button
  const handleRetry = () => {
    setRetryCount(0);
    fetchSettings();
  };

  // Loading state with timeout
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Error state - using Zustand store values
  if (!isAuthenticated || !currentTenantId || !isTenantActive) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!isAuthenticated 
              ? "Please log in to access settings."
              : !currentTenantId 
                ? "No tenant context available. Please ensure you are properly logged in."
                : !isTenantActive
                  ? "Your tenant account is not active. Please contact support."
                  : "Unable to access settings."
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="space-y-6">
        <Breadcrumbs 
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings", href: "/dashboard/settings" }
          ]} 
        />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your business settings and preferences
              {currentTenant && (
                <span className="block text-sm mt-1">
                  Tenant: <Badge variant="outline">{currentTenant.name}</Badge>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {lastSaveAttempt && (
              <Badge variant="outline">
                Last saved: {lastSaveAttempt.toLocaleTimeString()}
              </Badge>
            )}
            <Button 
              onClick={handleSaveSettings} 
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {showPreview && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Settings saved successfully! Your changes have been applied.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors: {Object.values(validationErrors).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="business" className="space-y-6">
          <TabsList>
            <TabsTrigger value="business">Business Info</TabsTrigger>
            <TabsTrigger value="customization">Form Customization</TabsTrigger>
            <TabsTrigger value="email">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Configure your business details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input
                      id="business_name"
                      value={settings.business_name || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        business_name: e.target.value 
                      }))}
                      placeholder="Enter your business name"
                    />
                    {validationErrors.business_name && (
                      <p className="text-sm text-destructive">{validationErrors.business_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_email">Business Email</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={settings.business_email || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        business_email: e.target.value 
                      }))}
                      placeholder="business@example.com"
                    />
                    {validationErrors.business_email && (
                      <p className="text-sm text-destructive">{validationErrors.business_email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_phone">Business Phone</Label>
                    <Input
                      id="business_phone"
                      value={settings.business_phone || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        business_phone: e.target.value 
                      }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_business_url">Google Business URL</Label>
                    <Input
                      id="google_business_url"
                      value={settings.google_business_url || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        google_business_url: e.target.value 
                      }))}
                      placeholder="https://g.page/your-business"
                    />
                    {validationErrors.google_business_url && (
                      <p className="text-sm text-destructive">{validationErrors.google_business_url}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address">Business Address</Label>
                  <Textarea
                    id="business_address"
                    value={settings.business_address || ''}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      business_address: e.target.value 
                    }))}
                    placeholder="Enter your business address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Form Customization
                </CardTitle>
                <CardDescription>
                  Customize the appearance and behavior of your review form
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={settings.form_customization?.primary_color || '#3b82f6'}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          form_customization: {
                            ...prev.form_customization,
                            primary_color: e.target.value
                          }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.form_customization?.primary_color || '#3b82f6'}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          form_customization: {
                            ...prev.form_customization,
                            primary_color: e.target.value
                          }
                        }))}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                    {validationErrors.primary_color && (
                      <p className="text-sm text-destructive">{validationErrors.primary_color}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={settings.form_customization?.secondary_color || '#1e40af'}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          form_customization: {
                            ...prev.form_customization,
                            secondary_color: e.target.value
                          }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.form_customization?.secondary_color || '#1e40af'}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          form_customization: {
                            ...prev.form_customization,
                            secondary_color: e.target.value
                          }
                        }))}
                        placeholder="#1e40af"
                        className="flex-1"
                      />
                    </div>
                    {validationErrors.secondary_color && (
                      <p className="text-sm text-destructive">{validationErrors.secondary_color}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome_message">Welcome Message</Label>
                  <Textarea
                    id="welcome_message"
                    value={settings.form_customization?.welcome_message || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      form_customization: {
                        ...prev.form_customization,
                        welcome_message: e.target.value
                      }
                    }))}
                    placeholder="Share your experience with [Business Name]"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Templates
                </CardTitle>
                <CardDescription>
                  Customize your email templates for review requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email_subject">Email Subject</Label>
                  <Input
                    id="email_subject"
                    value={settings.email_template?.subject || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email_template: {
                        ...prev.email_template,
                        subject: e.target.value
                      }
                    }))}
                    placeholder="We'd love your feedback!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_body">Email Body</Label>
                  <Textarea
                    id="email_body"
                    value={settings.email_template?.body || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      email_template: {
                        ...prev.email_template,
                        body: e.target.value
                      }
                    }))}
                    placeholder="Hi {{customer_name}}, we'd love to hear about your experience..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppErrorBoundary>
  );
};

export default DashboardSettingsZustand;
