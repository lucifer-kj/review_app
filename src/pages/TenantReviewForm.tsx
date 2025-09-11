import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, User, Phone, Mail, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useLoadingState } from '@/hooks/useLoadingState';
import { supabase } from '@/integrations/supabase/client';
import { BusinessSettingsService } from '@/services/businessSettingsService';

export default function TenantReviewForm() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitizeInput = (input: string | null): string | null => {
    if (!input) return null;
    return input
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .trim();
  };

  const sanitizedUtmParams = {
    trackingId: sanitizeInput(searchParams.get('tracking_id')),
    utmSource: sanitizeInput(searchParams.get('utm_source')),
    customerName: sanitizeInput(searchParams.get('customer')),
  };

  const { loadingState, execute: executeWithLoading } = useLoadingState<{
    name: string;
    domain?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: sanitizedUtmParams.customerName || '',
    phone: '',
    countryCode: '+1',
    rating: 0,
    reviewText: '',
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  useEffect(() => {
    const fetchTenantInfo = async () => {
      if (!tenantId) {
        console.error('No tenantId provided in URL');
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tenantId)) {
        console.error('Invalid tenantId format:', tenantId);
        throw new Error('Invalid business link format. Please check the URL and try again.');
      }

      await executeWithLoading(async () => {
        // Fetch tenant basic info
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('name, domain')
          .eq('id', tenantId)
          .single();

        if (tenantError) {
          console.error('Error fetching tenant info:', tenantError);
          // If tenant not found, show 404 error instead of redirecting
          if (tenantError.code === 'PGRST116') {
            throw new Error('Business not found. The review link may be invalid or expired.');
          }
          throw new Error('Unable to load business information. Please try again.');
        }

        // Fetch business settings for customization
        try {
          const { data: settingsData, error: settingsError } = await supabase
            .from('business_settings')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

          if (settingsError && settingsError.code !== 'PGRST116') {
            console.warn('Error fetching business settings:', settingsError);
          } else if (settingsData) {
            setBusinessSettings(settingsData);
          }
        } catch (error) {
          console.warn('Error loading business settings:', error);
        }

        return tenantData;
      });
    };

    fetchTenantInfo();
  }, [tenantId, navigate, toast, executeWithLoading]);

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (formData.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (!tenantId) {
      toast({
        title: "Error",
        description: "Invalid business link. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Submit the review directly to get the review ID
      const { data: insertedData, error } = await supabase
        .from('reviews')
        .insert({
          customer_name: formData.name.trim(),
          customer_phone: formData.phone.trim(),
          country_code: formData.countryCode || '+1',
          rating: formData.rating,
          google_review: formData.rating >= 4,
          redirect_opened: false,
          tenant_id: tenantId,
          metadata: {
            source: sanitizedUtmParams.utmSource || 'tenant_review_form',
            trackingId: sanitizedUtmParams.trackingId,
            submitted_at: new Date().toISOString(),
            google_review_url: businessSettings?.google_business_url
          }
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      // Show success message
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Handle conditional redirect based on rating
      if (formData.rating >= 4) {
        // Redirect to tenant's Google Review URL for ratings 4 and above
        const googleReviewUrl = businessSettings?.google_business_url;
        if (googleReviewUrl) {
          toast({
            title: "Redirecting to Google Reviews",
            description: "Please help us by leaving a review on Google!",
          });
          // Redirect to Google Review URL
          window.location.href = googleReviewUrl;
        } else {
          // Fallback to thank you page if no Google Review URL configured
          navigate('/review/tenant-thank-you', {
            state: {
              name: formData.name,
              rating: formData.rating,
              businessName: businessSettings?.business_name || loadingState.data?.name
            }
          });
        }
      } else {
        // Navigate to feedback page for ratings below 4
        toast({
          title: "We'd love to hear more",
          description: "Please help us improve by sharing more details about your experience.",
        });
        navigate('/review/feedback', {
          state: {
            name: formData.name,
            rating: formData.rating,
            reviewId: insertedData.id
          }
        });
      }
    } catch (error) {
      console.error('Review submission error:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Early return for invalid tenantId
  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Review Link</h2>
            <p className="text-gray-600 mb-4">
              The review link is missing the business identifier. Please check the URL and try again.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading business information...</p>
        </div>
      </div>
    );
  }

  if (loadingState.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Business</h2>
            <p className="text-gray-600 mb-4">{loadingState.error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!loadingState.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Business Not Found</h2>
            <p className="text-gray-600 mb-4">
              The business you're looking for doesn't exist or the link is invalid.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tenantInfo = loadingState.data;
  
  // Apply customizations from business settings
  const customizations = businessSettings?.form_customization || {};
  const primaryColor = customizations.primary_color || '#3b82f6';
  const secondaryColor = customizations.secondary_color || '#1e40af';
  const welcomeMessage = customizations.welcome_message || `Share your experience with ${tenantInfo.name}`;
  const businessName = businessSettings?.business_name || tenantInfo.name;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card style={{ 
          borderColor: primaryColor,
          boxShadow: `0 4px 6px -1px ${primaryColor}20`
        }}>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 mr-3" style={{ color: primaryColor }} />
              <div>
                <CardTitle className="text-3xl font-bold" style={{ color: primaryColor }}>
                  {businessName}
                </CardTitle>
                {tenantInfo.domain && (
                  <p className="text-sm text-gray-500">{tenantInfo.domain}</p>
                )}
              </div>
            </div>
            <CardDescription className="text-lg">
              {welcomeMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  <User className="inline h-4 w-4 mr-2" />
                  Your Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="text-base"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Phone Number *
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) => handleInputChange('countryCode', value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                      <SelectItem value="+33">+33</SelectItem>
                      <SelectItem value="+49">+49</SelectItem>
                      <SelectItem value="+81">+81</SelectItem>
                      <SelectItem value="+86">+86</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    className="flex-1 text-base"
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <Star className="inline h-4 w-4 mr-2" />
                  How would you rate your experience with {tenantInfo.name}? *
                </Label>
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoveredRating || formData.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 text-center">
                  {formData.rating === 0 && 'Click a star to rate'}
                  {formData.rating === 1 && 'Poor - We need to improve'}
                  {formData.rating === 2 && 'Fair - Below expectations'}
                  {formData.rating === 3 && 'Good - Met expectations'}
                  {formData.rating === 4 && 'Very Good - Exceeded expectations'}
                  {formData.rating === 5 && 'Excellent - Outstanding service'}
                </p>
                
                {/* Helpful message about what happens next */}
                {formData.rating > 0 && (
                  <div className="mt-3 p-3 rounded-lg text-sm" style={{
                    backgroundColor: formData.rating >= 4 ? '#dbeafe' : '#fef3c7',
                    borderColor: formData.rating >= 4 ? '#3b82f6' : '#f59e0b',
                    borderWidth: '1px'
                  }}>
                    {formData.rating >= 4 ? (
                      <p className="text-blue-800">
                        <strong>Great!</strong> After submitting, you'll be redirected to Google Reviews to help others discover {businessName}.
                      </p>
                    ) : (
                      <p className="text-amber-800">
                        <strong>We appreciate your feedback!</strong> After submitting, you'll be asked to share more details to help us improve.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <Label htmlFor="reviewText" className="text-sm font-medium">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id="reviewText"
                  value={formData.reviewText}
                  onChange={(e) => handleInputChange('reviewText', e.target.value)}
                  placeholder={`Tell us more about your experience with ${tenantInfo.name}...`}
                  rows={4}
                  className="text-base"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-base py-3"
                size="lg"
                style={{ 
                  backgroundColor: primaryColor,
                  borderColor: primaryColor
                }}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting Review...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                By submitting this review, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <img src="/web/icons8-logo-ios-17-outlined-96.png" alt="Crux Logo" className="h-6 w-6" />
            <span>Powered by Alpha Business Design</span>
          </div>
          <p className="mt-2">© {new Date().getFullYear()} Alpha Business Design. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}