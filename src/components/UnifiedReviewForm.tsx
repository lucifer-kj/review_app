import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { StarRating } from "./StarRating";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Phone, Star, Send, AlertTriangle, Mail, MapPin, Globe } from "lucide-react";
import { PhoneInput } from "./PhoneInput";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TenantReviewFormService, type TenantReviewFormSettings, type ReviewFormData } from "@/services/tenantReviewFormService";
import { LoadingSpinner } from "./LoadingSpinner";

interface UnifiedReviewFormProps {
  onSubmit?: (data: ReviewFormData) => void;
  tenantId?: string;
  className?: string;
}

export const UnifiedReviewForm = ({ onSubmit, tenantId, className = "" }: UnifiedReviewFormProps) => {
  const [searchParams] = useSearchParams();
  const { tenantId: paramTenantId } = useParams();
  const actualTenantId = tenantId || paramTenantId;
  
  const [formData, setFormData] = useState<ReviewFormData>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    rating: 0,
    review_text: "",
    utm_source: "",
    utm_campaign: "",
    utm_medium: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canCollect, setCanCollect] = useState(true);
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
  const utmCampaign = sanitizeInput(searchParams.get('utm_campaign'));
  const utmMedium = sanitizeInput(searchParams.get('utm_medium'));
  const oneTapRating = Number(sanitizeInput(searchParams.get('rating')) || 0);

  // Fetch tenant form settings
  const { data: formSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ['tenant-form-settings', actualTenantId],
    queryFn: () => TenantReviewFormService.getTenantFormSettings(actualTenantId!),
    enabled: !!actualTenantId,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (data: ReviewFormData) => 
      TenantReviewFormService.submitTenantReview(actualTenantId!, data),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Review Submitted!",
          description: formSettings?.data?.form_customization?.thank_you_message || "Thank you for your feedback!",
        });
        // Reset form
        setFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          rating: 0,
          review_text: "",
          utm_source: "",
          utm_campaign: "",
          utm_medium: "",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Submission Error",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Pre-fill form data from URL parameters
  useEffect(() => {
    if (customerName) {
      setFormData(prev => ({ ...prev, customer_name: decodeURIComponent(customerName) }));
    }
    if (oneTapRating && oneTapRating >= 1 && oneTapRating <= 5) {
      setFormData(prev => ({ ...prev, rating: oneTapRating }));
    }
    if (utmSource) {
      setFormData(prev => ({ ...prev, utm_source: utmSource }));
    }
    if (utmCampaign) {
      setFormData(prev => ({ ...prev, utm_campaign: utmCampaign }));
    }
    if (utmMedium) {
      setFormData(prev => ({ ...prev, utm_medium: utmMedium }));
    }
  }, [customerName, oneTapRating, utmSource, utmCampaign, utmMedium]);

  // Check if review collection is enabled
  useEffect(() => {
    if (formSettings?.data) {
      // For now, assume collection is always enabled
      // This could be enhanced with plan limits later
      setCanCollect(true);
    }
  }, [formSettings]);

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  };

  const capitalizeWords = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capitalized = capitalizeWords(e.target.value);
    setFormData(prev => ({ ...prev, customer_name: capitalized }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, customer_phone: value }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCollect) {
      toast({
        title: "Review Collection Disabled",
        description: "Review collection is currently disabled for this business.",
        variant: "destructive",
      });
      return;
    }

    if (!formSettings?.data) {
      toast({
        title: "Configuration Error",
        description: "Unable to load form settings. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate form data
    const validation = TenantReviewFormService.validateReviewFormData(formData, formSettings.data);
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        // Use custom submit handler if provided
        onSubmit(formData);
      } else {
        // Use default submission
        await submitReviewMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (settingsError || !formSettings?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load review form. Please check the URL and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const settings = formSettings.data;
  const customization = settings.form_customization || {};

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4 ${className}`}>
      <div className="form-container fade-in max-w-lg w-full">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex items-center justify-center">
              <div 
                className="p-4 rounded-2xl shadow-lg"
                style={{ backgroundColor: customization.primary_color || '#3b82f6' }}
              >
                <Building2 className="w-12 h-12 text-white" aria-hidden="true" />
              </div>
            </div>
            
            <div className="space-y-3">
              <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight">
                {settings.business_name}
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                {customization.welcome_message || `We'd love to hear about your experience with our services`}
              </CardDescription>
            </div>

            {/* Business Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              {settings.business_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{settings.business_email}</span>
                </div>
              )}
              {settings.business_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{settings.business_phone}</span>
                </div>
              )}
              {settings.business_address && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4" />
                  <span>{settings.business_address}</span>
                </div>
              )}
              {settings.google_business_url && (
                <div className="flex items-center gap-2 col-span-2">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={settings.google_business_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on Google
                  </a>
                </div>
              )}
            </div>

            {utmSource === 'email' && (
              <Alert className="mt-6">
                <AlertDescription>
                  📧 Thank you for responding to our review request!
                </AlertDescription>
              </Alert>
            )}

            {!canCollect && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Review collection is currently disabled for this business.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Name */}
              {customization.required_fields?.includes('customer_name') || customization.optional_fields?.includes('customer_name') ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <User className="w-5 h-5" />
                    Full Name {customization.required_fields?.includes('customer_name') && '*'}
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.customer_name}
                    onChange={handleNameChange}
                    disabled={isSubmitting}
                    required={customization.required_fields?.includes('customer_name')}
                    className="h-12"
                  />
                </div>
              ) : null}

              {/* Customer Email */}
              {customization.required_fields?.includes('customer_email') || customization.optional_fields?.includes('customer_email') ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Mail className="w-5 h-5" />
                    Email Address {customization.required_fields?.includes('customer_email') && '*'}
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.customer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    disabled={isSubmitting}
                    required={customization.required_fields?.includes('customer_email')}
                    className="h-12"
                  />
                </div>
              ) : null}

              {/* Customer Phone */}
              {customization.required_fields?.includes('customer_phone') || customization.optional_fields?.includes('customer_phone') ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Phone className="w-5 h-5" />
                    Phone Number {customization.required_fields?.includes('customer_phone') && '*'}
                  </Label>
                  <PhoneInput
                    value={formData.customer_phone || ''}
                    countryCode="+1"
                    onPhoneChange={(phone) => setFormData(prev => ({ ...prev, customer_phone: phone }))}
                    onCountryChange={(countryCode) => setFormData(prev => ({ ...prev, countryCode }))}
                    disabled={isSubmitting}
                    required={customization.required_fields?.includes('customer_phone')}
                  />
                </div>
              ) : null}

              {/* Rating */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Star className="w-5 h-5" />
                  Rate Your Experience *
                </Label>
                <div className="flex justify-center">
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={handleRatingChange}
                    size={32}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Review Text */}
              {customization.required_fields?.includes('review_text') || customization.optional_fields?.includes('review_text') ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <Star className="w-5 h-5" />
                    Your Review {customization.required_fields?.includes('review_text') && '*'}
                  </Label>
                  <Textarea
                    placeholder="Tell us about your experience..."
                    value={formData.review_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
                    disabled={isSubmitting}
                    required={customization.required_fields?.includes('review_text')}
                    className="min-h-[100px]"
                  />
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting || !canCollect}
                className="w-full h-12 text-lg"
                style={{ 
                  backgroundColor: customization.primary_color || '#3b82f6',
                  color: 'white'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : !canCollect ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Review Collection Disabled
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
