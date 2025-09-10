import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, CheckCircle2, Circle, Globe, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import type { BusinessSettings } from "@/types";

interface MobileSettingsProps {
  settings: BusinessSettings;
  onSettingsChange: (field: keyof BusinessSettings, value: string) => void;
  onSave: () => void;
  saving: boolean;
  setupProgress: number;
  setupSteps: Array<{
    label: string;
    completed: boolean;
    field: keyof BusinessSettings;
  }>;
}

export const MobileSettings = ({
  settings,
  onSettingsChange,
  onSave,
  saving,
  setupProgress,
  setupSteps
}: MobileSettingsProps) => {
  // Calculate setup completion
  const setupProgressData = {
    businessName: !!settings.business_name,
    businessEmail: !!settings.business_email,
    businessPhone: !!settings.business_phone,
    businessAddress: !!settings.business_address,
    googleBusinessUrl: !!settings.google_business_url,
  };

  const completedSteps = Object.values(setupProgressData).filter(Boolean).length;
  const totalSteps = Object.keys(setupProgressData).length;

  const validateGoogleBusinessUrl = (url: string) => {
    if (!url) return true;
    
    const googleBusinessPatterns = [
      /^https:\/\/(www\.)?google\.com\/maps\/place\/[^\/]+\/@[^\/]+/,
      /^https:\/\/(www\.)?google\.com\/maps\/place\/[^\/]+\/data=[^\/]+/,
      /^https:\/\/(www\.)?google\.com\/maps\/place\/[^\/]+/,
      /^https:\/\/(www\.)?google\.com\/business\/[^\/]+/,
      /^https:\/\/(www\.)?google\.com\/maps\/.*\/place\/.*/
    ];
    
    return googleBusinessPatterns.some(pattern => pattern.test(url));
  };

  return (
    <div className="lg:hidden space-y-6 p-6 pt-20">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Configure your business settings and preferences
        </p>
      </div>

      {/* Setup Progress */}
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
                style={{ width: `${setupProgress}%` }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {setupProgressData.businessName ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgressData.businessName ? "text-foreground" : "text-muted-foreground"}>Business Name</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {setupProgressData.businessEmail ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgressData.businessEmail ? "text-foreground" : "text-muted-foreground"}>Business Email</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {setupProgressData.businessPhone ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgressData.businessPhone ? "text-foreground" : "text-muted-foreground"}>Business Phone</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {setupProgressData.businessAddress ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgressData.businessAddress ? "text-foreground" : "text-muted-foreground"}>Business Address</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {setupProgressData.googleBusinessUrl ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={setupProgressData.googleBusinessUrl ? "text-foreground" : "text-muted-foreground"}>Google Business Profile</span>
              </div>
            </div>
            {setupProgress === 100 && (
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
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name" className="text-sm">Business Name</Label>
              <Input
                id="business-name"
                value={settings.business_name || ""}
                onChange={(e) => onSettingsChange('business_name', e.target.value)}
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
                onChange={(e) => onSettingsChange('business_email', e.target.value)}
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
                onChange={(e) => onSettingsChange('business_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-address" className="text-sm">Business Address</Label>
              <Textarea
                id="business-address"
                value={settings.business_address || ""}
                onChange={(e) => onSettingsChange('business_address', e.target.value)}
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
                onChange={(e) => onSettingsChange('google_business_url', e.target.value)}
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

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} size="lg" className="w-full sm:w-auto text-sm sm:text-base">
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
  );
};
