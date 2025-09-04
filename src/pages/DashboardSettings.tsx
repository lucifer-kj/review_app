import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BusinessSettingsService } from "@/services/businessSettingsService";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MobileSettings } from "@/components/MobileSettings";
import { 
  Settings, 
  Link, 
  Save, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Circle
} from "lucide-react";
import type { BusinessSettings } from "@/types";

const DashboardSettings = () => {
  const [settings, setSettings] = useState<BusinessSettings>({
    google_business_url: null,
    business_name: null,
    business_email: null,
    business_phone: null,
    business_address: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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

  const fetchSettings = useCallback(async () => {
    try {
      const response = await BusinessSettingsService.getSettings();
      
      if (response.success && response.data) {
        setSettings(response.data);
        if (response.data.business_name === null) {
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
    setSaving(true);
    try {
      const response = await BusinessSettingsService.updateSettings(settings);
      
      if (response.success) {
        toast({
          title: "Settings Saved",
          description: "Your business settings have been updated successfully.",
        });
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
    const googleBusinessPattern = /^https:\/\/(www\.)?google\.com\/maps\/place\/.*\/@.*\/data=.*$/;
    return googleBusinessPattern.test(url);
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
    <div className="space-y-6">
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
      <div className="hidden lg:block">
        <Breadcrumbs 
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Settings", isCurrent: true }
          ]} 
          className="mb-4"
        />
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Configure your business settings and preferences
          </p>
        </div>

      {/* Setup Progress */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CheckCircle2 className="h-5 w-5" />
            Setup Progress
          </CardTitle>
          <CardDescription className="text-sm">
            Complete your business profile to start collecting reviews
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
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
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {setupProgress.businessName ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgress.businessName ? "text-foreground" : "text-muted-foreground"}>Business Name</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {setupProgress.businessEmail ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgress.businessEmail ? "text-foreground" : "text-muted-foreground"}>Business Email</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {setupProgress.businessPhone ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgress.businessPhone ? "text-foreground" : "text-muted-foreground"}>Business Phone</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {setupProgress.businessAddress ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgress.businessAddress ? "text-foreground" : "text-muted-foreground"}>Business Address</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {setupProgress.googleBusinessUrl ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgress.googleBusinessUrl ? "text-foreground" : "text-muted-foreground"}>Google Business Profile</span>
              </div>
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

      {/* Business Information */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription className="text-sm">
            Update your business details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name" className="text-sm">Business Name</Label>
              <Input
                id="business-name"
                value={settings.business_name || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Alpha Business Designs"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-email" className="text-sm">Business Email</Label>
              <Input
                id="business-email"
                type="email"
                value={settings.business_email || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, business_email: e.target.value }))}
                placeholder="contact@alphabusiness.com"
                className="text-sm sm:text-base"
              />
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
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Globe className="h-5 w-5" />
            Google Business Integration
          </CardTitle>
          <CardDescription className="text-sm">
            Configure your Google Business profile for review collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
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
            {!validateGoogleBusinessUrl(settings.google_business_url || "") && settings.google_business_url && (
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



      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving} size="lg" className="w-full sm:w-auto text-sm sm:text-base">
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
    </div>
  );
};

export default DashboardSettings;
