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
import { 
  Settings, 
  Link, 
  Upload, 
  Download, 
  Save, 
  Globe, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Trash2
} from "lucide-react";
import type { BusinessSettings } from "@/types";

const DashboardSettings = () => {
  const [settings, setSettings] = useState<BusinessSettings>({
    google_business_url: null,
    business_name: null,
    business_email: null,
    business_phone: null,
    business_address: null,
    invoice_template_url: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const { toast } = useToast();

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
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTemplateFile(file);

    try {
      const response = await BusinessSettingsService.uploadInvoiceTemplate(file);
      
      if (response.success && response.data) {
        // Update settings with new template URL
        setSettings(prev => ({
          ...prev,
          invoice_template_url: response.data.url
        }));

        toast({
          title: "Template Uploaded",
          description: "Invoice template has been uploaded successfully.",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: response.error || "Failed to upload template. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveTemplate = async () => {
    if (!settings.invoice_template_url) return;

    try {
      // Extract filename from URL
      const fileName = settings.invoice_template_url.split('/').pop();
      if (fileName) {
        const response = await BusinessSettingsService.deleteInvoiceTemplate(fileName);
        
        if (!response.success) {
          toast({
            title: "Remove Failed",
            description: response.error || "Failed to remove template. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      setSettings(prev => ({
        ...prev,
        invoice_template_url: null
      }));

      toast({
        title: "Template Removed",
        description: "Invoice template has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove template. Please try again.",
        variant: "destructive",
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Configure your business settings and preferences
        </p>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription className="text-sm">
            Update your business details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={settings.business_name || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Alpha Business Designs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-email">Business Email</Label>
              <Input
                id="business-email"
                type="email"
                value={settings.business_email || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, business_email: e.target.value }))}
                placeholder="contact@alphabusiness.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-phone">Business Phone</Label>
              <Input
                id="business-phone"
                type="tel"
                value={settings.business_phone || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, business_phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-address">Business Address</Label>
              <Textarea
                id="business-address"
                value={settings.business_address || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, business_address: e.target.value }))}
                placeholder="123 Business St, City, State 12345"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Business Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Globe className="h-5 w-5" />
            Google Business Integration
          </CardTitle>
          <CardDescription className="text-sm">
            Configure your Google Business profile for review collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-business-url">Google Business Profile URL</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="google-business-url"
                value={settings.google_business_url || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, google_business_url: e.target.value }))}
                placeholder="https://www.google.com/maps/place/Your-Business/@lat,lng,zoom/data=..."
                className={!validateGoogleBusinessUrl(settings.google_business_url || "") ? "border-destructive" : ""}
              />
              {settings.google_business_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(settings.google_business_url, '_blank')}
                  className="w-full sm:w-auto"
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

      {/* Invoice Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-5 w-5" />
            Invoice Template
          </CardTitle>
          <CardDescription className="text-sm">
            Upload an ODT template file for invoice generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Template File (ODT format only)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="file"
                accept=".odt"
                onChange={handleFileUpload}
                disabled={uploading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Uploading...
                </div>
              )}
            </div>
          </div>

          {settings.invoice_template_url && (
            <div className="p-4 border rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-sm sm:text-base">Current Template</span>
                  <Badge variant="secondary" className="text-xs">ODT</Badge>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(settings.invoice_template_url, '_blank')}
                    className="flex-1 sm:flex-none"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Download</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveTemplate}
                    className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Template Requirements:</h4>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>File format: ODT (OpenDocument Text)</li>
              <li>Maximum file size: 10MB</li>
              <li>Use placeholders like {"{{customer_name}}"}, {"{{invoice_number}}"}, {"{{total}}"} for dynamic content</li>
              <li>Template will be used to generate PDF invoices</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving} size="lg" className="w-full sm:w-auto">
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

export default DashboardSettings;
