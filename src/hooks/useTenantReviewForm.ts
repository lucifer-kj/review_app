import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TenantReviewFormService, type TenantReviewFormSettings, type ReviewFormData } from "@/services/tenantReviewFormService";
import { toast } from "sonner";

export function useTenantReviewForm(tenantId: string) {
  const queryClient = useQueryClient();

  // Get tenant form settings
  const {
    data: formSettings,
    isLoading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['tenant-form-settings', tenantId],
    queryFn: () => TenantReviewFormService.getTenantFormSettings(tenantId),
    enabled: !!tenantId,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (reviewData: ReviewFormData) => 
      TenantReviewFormService.submitTenantReview(tenantId, reviewData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Review submitted successfully!");
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['reviews', tenantId] });
        queryClient.invalidateQueries({ queryKey: ['review-stats', tenantId] });
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  // Generate email template
  const generateEmailTemplate = (variables: {
    customer_name: string;
    business_name: string;
    review_link: string;
    business_email?: string;
    business_phone?: string;
  }) => {
    if (!formSettings?.data?.email_template) {
      return {
        subject: `Share your experience with ${variables.business_name}`,
        body: `Hi ${variables.customer_name},\n\nWe hope you enjoyed your experience with us! We'd love to hear your feedback.\n\nPlease take a moment to share your review: ${variables.review_link}\n\nThank you for choosing us!\n\nBest regards,\n${variables.business_name}`
      };
    }

    return {
      subject: TenantReviewFormService.generateEmailTemplate(
        formSettings.data.email_template.subject,
        variables
      ),
      body: TenantReviewFormService.generateEmailTemplate(
        formSettings.data.email_template.body,
        variables
      ),
      footer: formSettings.data.email_template.footer ? 
        TenantReviewFormService.generateEmailTemplate(
          formSettings.data.email_template.footer,
          variables
        ) : undefined
    };
  };

  // Get review form URL
  const getReviewFormUrl = (baseUrl?: string) => {
    return TenantReviewFormService.getTenantReviewFormUrl(tenantId, baseUrl);
  };

  // Validate form data
  const validateFormData = (data: ReviewFormData) => {
    if (!formSettings?.data) {
      return { isValid: false, errors: ['Form settings not loaded'] };
    }
    return TenantReviewFormService.validateReviewFormData(data, formSettings.data);
  };

  return {
    // Settings
    formSettings: formSettings?.data,
    settingsLoading,
    settingsError,
    refetchSettings,

    // Form submission
    submitReview: submitReviewMutation.mutate,
    isSubmitting: submitReviewMutation.isPending,
    submitError: submitReviewMutation.error,

    // Utilities
    generateEmailTemplate,
    getReviewFormUrl,
    validateFormData,
  };
}
