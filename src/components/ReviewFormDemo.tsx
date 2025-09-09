import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnifiedReviewForm } from "./UnifiedReviewForm";
import { useTenantReviewForm } from "@/hooks/useTenantReviewForm";
import { toast } from "sonner";

export function ReviewFormDemo() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const { formSettings, settingsLoading } = useTenantReviewForm(selectedTenantId);

  const handleFormSubmit = (data: any) => {
    console.log('Review submitted:', data);
    toast.success("Review submitted successfully!");
    setShowForm(false);
  };

  const handleTestForm = () => {
    if (!selectedTenantId) {
      toast.error("Please enter a tenant ID");
      return;
    }
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setShowForm(false)}
          >
            ← Back to Demo
          </Button>
          <div>
            <h3 className="font-semibold">Testing Review Form for Tenant: {selectedTenantId}</h3>
            {formSettings && (
              <p className="text-sm text-muted-foreground">
                Business: {formSettings.business_name}
              </p>
            )}
          </div>
        </div>
        <UnifiedReviewForm 
          onSubmit={handleFormSubmit}
          tenantId={selectedTenantId}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Form Demo</CardTitle>
          <CardDescription>
            Test the unified review form with different tenant configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-id">Tenant ID</Label>
            <Input
              id="tenant-id"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              placeholder="Enter tenant ID to test"
            />
          </div>
          
          <Button 
            onClick={handleTestForm}
            disabled={!selectedTenantId || settingsLoading}
            className="w-full"
          >
            {settingsLoading ? "Loading..." : "Test Review Form"}
          </Button>

          {formSettings && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Current Settings:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Business Name:</strong> {formSettings.business_name}</p>
                <p><strong>Primary Color:</strong> 
                  <span 
                    className="inline-block w-4 h-4 rounded ml-2" 
                    style={{ backgroundColor: formSettings.form_customization?.primary_color }}
                  ></span>
                  {formSettings.form_customization?.primary_color}
                </p>
                <p><strong>Required Fields:</strong> {formSettings.form_customization?.required_fields?.join(', ')}</p>
                <p><strong>Optional Fields:</strong> {formSettings.form_customization?.optional_fields?.join(', ')}</p>
                <p><strong>Welcome Message:</strong> {formSettings.form_customization?.welcome_message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
