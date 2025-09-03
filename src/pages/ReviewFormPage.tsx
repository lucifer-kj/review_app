import { useEffect } from "react";
import { ReviewForm } from "@/components/ReviewForm";
import { useReviewFlow } from "@/hooks/useReviewFlow";

export default function ReviewFormPage() {
  const { handleReviewSubmit, sanitizedUtmParams } = useReviewFlow();

  // Pre-fill name if provided in URL
  useEffect(() => {
    if (sanitizedUtmParams.customerName) {
      // The ReviewForm component will handle pre-filling from URL params
    }
  }, [sanitizedUtmParams.customerName]);

  return <ReviewForm onSubmit={handleReviewSubmit} />;
}
