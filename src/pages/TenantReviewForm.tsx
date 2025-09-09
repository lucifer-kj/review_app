import { useParams, useNavigate } from "react-router-dom";
import { UnifiedReviewForm } from "@/components/UnifiedReviewForm";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { TenantReviewFormService } from "@/services/tenantReviewFormService";

export default function TenantReviewForm() {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (data: any) => 
      TenantReviewFormService.submitTenantReview(tenantId!, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Review submitted successfully!");
        navigate(`/review/tenant-thank-you?tenant=${tenantId}`);
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const handleSubmit = (data: any) => {
    submitReviewMutation.mutate(data);
  };

  return (
    <UnifiedReviewForm 
      onSubmit={handleSubmit} 
      tenantId={tenantId} 
    />
  );
}