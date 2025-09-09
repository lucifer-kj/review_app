import { useParams } from "react-router-dom";
import { UnifiedReviewForm } from "@/components/UnifiedReviewForm";
import { useReviewFlow } from "@/hooks/useReviewFlow";

export default function ReviewFormPage() {
  const { tenantId } = useParams();
  const { handleReviewSubmit } = useReviewFlow();

  return (
    <UnifiedReviewForm 
      onSubmit={handleReviewSubmit} 
      tenantId={tenantId} 
    />
  );
}
