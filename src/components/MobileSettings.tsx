import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings, Save, CheckCircle2, Circle, Globe, ExternalLink } from "lucide-react";
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
  return (
    <div className="lg:hidden space-y-6 px-1">
      {/* Page Title */}
      <div className="px-2">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your business settings and preferences</p>
      </div>

      {/* Setup Progress */}
      <Card className="mx-2 p-6 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-700">Setup Progress</h2>
            <p className="text-sm text-blue-600/80">Complete your business profile</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-blue-700">Profile Completion</span>
            <span className="text-sm text-blue-600">{Math.round(setupProgress)}%</span>
          </div>
          
          <Progress value={setupProgress} className="h-3 bg-blue-200" />
          
          <div className="space-y-3">
            {setupSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-blue-400" />
                )}
                <span className={`text-sm font-medium ${step.completed ? 'text-green-700' : 'text-blue-600'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          
          {setupProgress === 100 && (
            <div className="bg-green-100 border border-green-200 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700">Setup Complete!</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Business Information */}
      <Card className="mx-2 p-6 shadow-lg border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Business Information</h2>
            <p className="text-sm text-muted-foreground">Update your business details</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="business_name" className="text-base font-medium">Business Name</Label>
            <Input
              id="business_name"
              value={settings.business_name || ''}
              onChange={(e) => onSettingsChange('business_name', e.target.value)}
              placeholder="Enter your business name"
              className="mt-2 h-12 text-base shadow-sm border-2 rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="business_email" className="text-base font-medium">Business Email</Label>
            <Input
              id="business_email"
              type="email"
              value={settings.business_email || ''}
              onChange={(e) => onSettingsChange('business_email', e.target.value)}
              placeholder="Enter your business email"
              className="mt-2 h-12 text-base shadow-sm border-2 rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="business_phone" className="text-base font-medium">Business Phone</Label>
            <Input
              id="business_phone"
              value={settings.business_phone || ''}
              onChange={(e) => onSettingsChange('business_phone', e.target.value)}
              placeholder="Enter your business phone"
              className="mt-2 h-12 text-base shadow-sm border-2 rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="business_address" className="text-base font-medium">Business Address</Label>
            <Textarea
              id="business_address"
              value={settings.business_address || ''}
              onChange={(e) => onSettingsChange('business_address', e.target.value)}
              placeholder="Enter your business address"
              className="mt-2 min-h-[100px] text-base shadow-sm border-2 rounded-xl resize-none"
            />
          </div>

          <div>
            <Label htmlFor="google_business_url" className="text-base font-medium">Google Business URL</Label>
            <div className="mt-2 space-y-3">
              <Input
                id="google_business_url"
                value={settings.google_business_url || ''}
                onChange={(e) => onSettingsChange('google_business_url', e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                className="h-12 text-base shadow-sm border-2 rounded-xl"
              />
              {settings.google_business_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(settings.google_business_url!, '_blank')}
                  className="w-full h-10 text-base font-medium shadow-sm border-2 rounded-xl"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Test Google Business Link
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="px-2 pb-6">
        <Button
          onClick={onSave}
          disabled={saving}
          size="lg"
          className="w-full h-14 text-base font-semibold shadow-lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-3" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
