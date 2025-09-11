import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Building2 } from 'lucide-react';
import type { BusinessSettings } from '@/types';

interface ReviewFormPreviewProps {
  settings: BusinessSettings;
  tenantName: string;
}

export const ReviewFormPreview = ({ settings, tenantName }: ReviewFormPreviewProps) => {
  const businessName = settings.business_name || tenantName;
  const welcomeMessage = settings.form_customization?.welcome_message || `Share your experience with ${businessName}`;
  const primaryColor = settings.form_customization?.primary_color || '#3b82f6';

  return (
    <div className="mt-6 border rounded-lg p-4 bg-muted/50">
      <h3 className="text-lg font-medium mb-4">Form Preview</h3>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 scale-75 -translate-x-1/4 w-[150%]">
        <div className="max-w-2xl mx-auto">
          <Card style={{ borderColor: primaryColor, boxShadow: `0 4px 6px -1px ${primaryColor}20` }}>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 mr-3" style={{ color: primaryColor }} />
                <div>
                  <CardTitle className="text-3xl font-bold" style={{ color: primaryColor }}>
                    {businessName}
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-lg">
                {welcomeMessage}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name-preview">Your Name *</Label>
                  <Input id="name-preview" type="text" placeholder="Enter your full name" disabled />
                </div>
                <div className="space-y-2">
                  <Label>How would you rate your experience? *</Label>
                  <div className="flex gap-1 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" className="focus:outline-none">
                        <Star className="h-8 w-8 text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full text-base py-3" size="lg" style={{ backgroundColor: primaryColor, borderColor: primaryColor }} disabled>
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
