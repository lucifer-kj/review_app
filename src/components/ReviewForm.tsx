import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { StarRating } from "./StarRating";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Phone, Star, Send, AlertTriangle, Crown } from "lucide-react";
import { PhoneInput } from "./PhoneInput";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { ReviewLimitService } from "@/services/reviewLimitService";

interface ReviewFormProps {
  onSubmit: (data: { name: string; phone: string; countryCode: string; rating: number; tenantId?: string }) => void;
  businessName?: string;
  tenantId?: string;
}

export const ReviewForm = ({ onSubmit, businessName = "Business", tenantId }: ReviewFormProps) => {
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    countryCode: "+1",
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canCollect, setCanCollect] = useState(true);
  const [reviewLimits, setReviewLimits] = useState<any>(null);
  const { toast } = useToast();

  // Extract and sanitize URL parameters
  const sanitizeInput = (input: string | null): string => {
    if (!input) return "";
    return input
      .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim();
  };

  const customerName = sanitizeInput(searchParams.get('customer'));
  const utmSource = sanitizeInput(searchParams.get('utm_source'));
  const oneTapRating = Number(sanitizeInput(searchParams.get('rating')) || 0);
  const urlTenantId = sanitizeInput(searchParams.get('tenant_id'));

  // Pre-fill name if provided in URL
  useEffect(() => {
    if (customerName) {
      setFormData(prev => ({ ...prev, name: decodeURIComponent(customerName) }));
    }
    if (oneTapRating && oneTapRating >= 1 && oneTapRating <= 5) {
      setFormData(prev => ({ ...prev, rating: oneTapRating }));
    }
  }, [customerName, oneTapRating]);

  // Check review limits if tenantId is provided (from props or URL)
  useEffect(() => {
    const effectiveTenantId = tenantId || urlTenantId;
    if (effectiveTenantId) {
      checkReviewLimits(effectiveTenantId);
    }
  }, [tenantId, urlTenantId]);

  const checkReviewLimits = async (effectiveTenantId: string) => {
    try {
      const response = await ReviewLimitService.getTenantReviewLimits(effectiveTenantId);
      if (response.success && response.data) {
        setReviewLimits(response.data);
        setCanCollect(response.data.can_collect);
        
        if (!response.data.can_collect) {
          toast({
            title: "Review Collection Disabled",
            description: `This business has reached their review limit (${response.data.max_reviews} reviews on ${response.data.plan_type} plan).`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error checking review limits:', error);
    }
  };

  const validatePhone = (phone: string) => {
    // Remove all non-digit characters and check if it's between 7-15 digits
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  };

  const capitalizeWords = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capitalized = capitalizeWords(e.target.value);
    setFormData(prev => ({ ...prev, name: capitalized }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const effectiveTenantId = tenantId || urlTenantId;
    
    // Check if review collection is disabled due to plan limits
    if (effectiveTenantId && !canCollect) {
      toast({
        title: "Review Collection Disabled",
        description: "This business has reached their review limit. Please contact them directly.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number (7-15 digits)",
        variant: "destructive",
      });
      return;
    }

    if (formData.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate form submission delay
      await new Promise(resolve => setTimeout(resolve, 800));
      // Pass the effective tenant ID along with form data
      onSubmit({
        ...formData,
        tenantId: effectiveTenantId
      });
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="form-container fade-in max-w-lg w-full">
        <div className="text-center mb-8 space-y-6">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl shadow-lg">
              <Building2 className="w-12 h-12 text-primary-foreground" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {businessName}
            </h1>
            <p className="text-lg text-muted-foreground text-body max-w-md mx-auto">
              We'd love to hear about your experience with our services
            </p>
          </div>
          {utmSource === 'email' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm" role="status" aria-live="polite">
              <p className="text-sm text-blue-700 font-medium">
                📧 Thank you for responding to our review request!
              </p>
            </div>
          )}

          {/* Plan Limit Warning */}
          {tenantId && reviewLimits && !canCollect && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Review Collection Temporarily Disabled</div>
                  <div className="text-sm">
                    This business has reached their review limit of {reviewLimits.max_reviews} reviews 
                    on their {reviewLimits.plan_type} plan. Please contact them directly for feedback.
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Crown className="w-4 h-4" />
                    <span className="text-sm">Upgrade available for more capacity</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" role="form" aria-label="Review submission form">
          <div className="form-field">
            <label className="form-label flex items-center gap-3" htmlFor="name-input">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
              </div>
              Full Name *
            </label>
            <input
              id="name-input"
              type="text"
              className="form-input"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleNameChange}
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby="name-error"
              aria-invalid={!formData.name.trim() && isSubmitting}
            />
            {!formData.name.trim() && isSubmitting && (
              <div id="name-error" className="text-red-500 text-sm mt-2 flex items-center gap-2" role="alert">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                Name is required
              </div>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-3">
            <Label className="form-label flex items-center gap-2 text-base font-medium" htmlFor="phone-input">
              <Phone className="w-5 h-5" aria-hidden="true" />
              Phone Number
            </Label>
            <PhoneInput
              value={formData.phone}
              countryCode={formData.countryCode}
              onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
              onCountryChange={(countryCode) => setFormData(prev => ({ ...prev, countryCode }))}
              disabled={isSubmitting}
              aria-describedby="phone-error"
            />
          </div>

          {/* Rating Field */}
          <div className="space-y-3">
            <Label className="form-label flex items-center gap-2 text-base font-medium" htmlFor="rating-input">
              <Star className="w-5 h-5" aria-hidden="true" />
              Rate Your Experience *
            </Label>
            <div className="flex justify-center">
              <StarRating
                rating={formData.rating}
                onRatingChange={handleRatingChange}
                size={32}
                aria-required={true}
                aria-describedby="rating-error"
                aria-invalid={formData.rating === 0 && isSubmitting}
              />
            </div>
            {formData.rating === 0 && isSubmitting && (
              <div id="rating-error" className="text-red-500 text-sm text-center" role="alert">
                Please select a rating
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || (tenantId && !canCollect)}
            className="w-full scale-in flex items-center justify-center gap-3"
            aria-describedby="submit-status"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : tenantId && !canCollect ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                Review Collection Disabled
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Review
              </>
            )}
          </Button>
          
          {isSubmitting && (
            <div id="submit-status" className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2" role="status" aria-live="polite">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
              Please wait while we submit your review...
            </div>
          )}
        </form>
      </div>
    </div>
  );
};