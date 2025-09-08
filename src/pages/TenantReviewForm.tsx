import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, Loader2, Send, Building2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TenantService } from "@/services/tenantService";
import { ReviewService } from "@/services/reviewService";
import { toast } from "sonner";

export default function TenantReviewForm() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    rating: 0,
    reviewText: "",
  });

  // Fetch tenant information
  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const result = await TenantService.getTenantById(tenantId!);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tenant');
      }
      return result.data!;
    },
    enabled: !!tenantId,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      ReviewService.submitReview({
        tenant_id: tenantId!,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        rating: data.rating,
        review_text: data.reviewText,
      }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Review submitted successfully!");
        navigate(`/review/thank-you?tenant=${tenantId}`);
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    submitReviewMutation.mutate(formData);
  };

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load review form. Please check the URL and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
            Leave a Review
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Share your experience with {tenant.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Review</CardTitle>
            <CardDescription>
              Help {tenant.name} improve by sharing your honest feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customerName">Your Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter your name"
                  required
                  disabled={submitReviewMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="your@email.com"
                  disabled={submitReviewMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>Rating *</Label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className={`p-1 rounded ${
                        star <= formData.rating
                          ? "text-yellow-400"
                          : "text-gray-300 hover:text-yellow-300"
                      }`}
                      disabled={submitReviewMutation.isPending}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {formData.rating === 0 && "Click a star to rate"}
                  {formData.rating === 1 && "Poor"}
                  {formData.rating === 2 && "Fair"}
                  {formData.rating === 3 && "Good"}
                  {formData.rating === 4 && "Very Good"}
                  {formData.rating === 5 && "Excellent"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewText">Your Review</Label>
                <Textarea
                  id="reviewText"
                  value={formData.reviewText}
                  onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  disabled={submitReviewMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitReviewMutation.isPending || formData.rating === 0}
              >
                {submitReviewMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
