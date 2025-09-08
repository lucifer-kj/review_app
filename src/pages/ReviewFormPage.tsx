import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ReviewForm } from "@/components/ReviewForm";
import { useReviewFlow } from "@/hooks/useReviewFlow";
import { BusinessSettingsService } from "@/services/businessSettingsService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";

export default function ReviewFormPage() {
  const { tenantId } = useParams();
  const { handleReviewSubmit, sanitizedUtmParams } = useReviewFlow();
  const [businessName, setBusinessName] = useState("Business");

  // Fetch tenant business settings if tenantId is provided
  const { data: businessSettings, isLoading } = useQuery({
    queryKey: ['business-settings', tenantId],
    queryFn: () => BusinessSettingsService.getBusinessSettings(),
    enabled: !!tenantId,
  });

  // Update business name when settings are loaded
  useEffect(() => {
    if (businessSettings?.success && businessSettings.data?.business_name) {
      setBusinessName(businessSettings.data.business_name);
    }
  }, [businessSettings]);

  // Pre-fill name if provided in URL
  useEffect(() => {
    if (sanitizedUtmParams.customerName) {
      // The ReviewForm component will handle pre-filling from URL params
    }
  }, [sanitizedUtmParams.customerName]);

  if (isLoading && tenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <ReviewForm onSubmit={handleReviewSubmit} businessName={businessName} />;
}
