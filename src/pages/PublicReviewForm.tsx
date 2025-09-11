import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, User, Phone, Mail, Building2, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

interface TenantInfo {
  id: string;
  name: string;
  status: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  google_business_url: string;
  form_customization: {
    primary_color?: string;
    secondary_color?: string;
    welcome_message?: string;
    thank_you_message?: string;
    required_fields?: string[];
    optional_fields?: string[];
  };
}

interface ReviewSubmissionResult {
  success: boolean;
  review_id: string | null;
  message: string;
}

export default function PublicReviewForm() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    country_code: '+1',
    rating: 0,
    review_text: '',
  });

  const [hoveredRating, setHoveredRating] = useState(0);

  // Fetch tenant information
  useEffect(() => {
    const fetchTenantInfo = async () => {
      if (!tenantId) {
        setError('Invalid tenant ID');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_tenant_for_public_review', { p_tenant_id: tenantId });

        if (error) {
          console.error('Error fetching tenant info:', error);
          setError('Failed to load business information');
          return;
        }

        if (!data || data.length === 0) {
          setError('Business not found or inactive');
          return;
        }

        const tenant = data[0];
        setTenantInfo(tenant);
      } catch (err) {
        console.error('Error fetching tenant info:', err);
        setError('Failed to load business information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantInfo();
  }, [tenantId]);

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !tenantInfo) return;

    setIsSubmitting(true);

    // Validate required fields
    if (!formData.customer_name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to submit a review.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating to submit a review.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit review using the secure function
      const { data, error } = await supabase
        .rpc('submit_public_review', {
          p_tenant_id: tenantId,
          p_customer_name: formData.customer_name.trim(),
          p_customer_email: formData.customer_email.trim() || null,
          p_customer_phone: formData.customer_phone.trim() || null,
          p_country_code: formData.country_code,
          p_rating: formData.rating,
          p_review_text: formData.review_text.trim() || null,
          p_metadata: {
            submitted_via: 'public_form',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Error submitting review:', error);
        toast({
          title: "Submission Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const result = data[0] as ReviewSubmissionResult;

      if (!result.success) {
        toast({
          title: "Submission Failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      // Show success message
      toast({
        title: "Review Submitted Successfully!",
        description: "Thank you for your feedback!",
      });

      // Handle redirect based on rating and business settings
      if (formData.rating >= 4 && tenantInfo.google_business_url) {
        // Show message and redirect to Google Reviews
        toast({
          title: "Redirecting to Google Reviews",
          description: "Please help us by leaving a review on Google!",
        });
        
        // Small delay to show the toast, then redirect
        setTimeout(() => {
          window.location.href = tenantInfo.google_business_url;
        }, 1500);
      } else {
        // Navigate to thank you page
        navigate('/review/thank-you', {
          state: {
            name: formData.customer_name,
            rating: formData.rating,
            businessName: tenantInfo.business_name || tenantInfo.name
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tenantInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Business Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'The business you\'re looking for is not available or has been deactivated.'}
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get customization settings
  const customization = tenantInfo.form_customization || {};
  const primaryColor = customization.primary_color || '#3b82f6';
  const secondaryColor = customization.secondary_color || '#1e40af';
  const welcomeMessage = customization.welcome_message || `Share your experience with ${tenantInfo.business_name || tenantInfo.name}`;
  const requiredFields = customization.required_fields || ['customer_name', 'rating'];

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
                  {tenantInfo.business_name || tenantInfo.name}
                </CardTitle>
                {tenantInfo.business_email && (
                  <p className="text-sm text-gray-500">{tenantInfo.business_email}</p>
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
                <Label htmlFor="customer_name" className="text-sm font-medium">
                  <User className="inline h-4 w-4 mr-2" />
                  Your Name *
                </Label>
                <Input
                  id="customer_name"
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="text-base"
                />
              </div>

              {/* Customer Email (if required or provided) */}
              {(requiredFields.includes('customer_email') || formData.customer_email) && (
                <div className="space-y-2">
                  <Label htmlFor="customer_email" className="text-sm font-medium">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email Address {requiredFields.includes('customer_email') ? '*' : '(Optional)'}
                  </Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="Enter your email address"
                    required={requiredFields.includes('customer_email')}
                    className="text-base"
                  />
                </div>
              )}

              {/* Phone Number (if required or provided) */}
              {(requiredFields.includes('customer_phone') || formData.customer_phone) && (
                <div className="space-y-2">
                  <Label htmlFor="customer_phone" className="text-sm font-medium">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone Number {requiredFields.includes('customer_phone') ? '*' : '(Optional)'}
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.country_code}
                      onValueChange={(value) => handleInputChange('country_code', value)}
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
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      placeholder="Enter your phone number"
                      required={requiredFields.includes('customer_phone')}
                      className="flex-1 text-base"
                    />
                  </div>
                </div>
              )}

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <Star className="inline h-4 w-4 mr-2" />
                  How would you rate your experience with {tenantInfo.business_name || tenantInfo.name}? *
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
                    borderColor: formData.rating >= 4 ? primaryColor : '#f59e0b',
                    borderWidth: '1px'
                  }}>
                    {formData.rating >= 4 && tenantInfo.google_business_url ? (
                      <div className="text-blue-800">
                        <p className="font-semibold mb-1">🌟 Great! Here's what happens next:</p>
                        <p>After submitting, you'll be redirected to Google Reviews to help others discover {tenantInfo.business_name || tenantInfo.name}.</p>
                        <div className="mt-2 flex items-center text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <span>You'll be taken to: {tenantInfo.google_business_url}</span>
                        </div>
                      </div>
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
                <Label htmlFor="review_text" className="text-sm font-medium">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Additional Comments {requiredFields.includes('review_text') ? '*' : '(Optional)'}
                </Label>
                <Textarea
                  id="review_text"
                  value={formData.review_text}
                  onChange={(e) => handleInputChange('review_text', e.target.value)}
                  placeholder={`Tell us more about your experience with ${tenantInfo.business_name || tenantInfo.name}...`}
                  rows={4}
                  required={requiredFields.includes('review_text')}
                  className="text-base"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-base py-3"
                style={{ 
                  backgroundColor: primaryColor,
                  borderColor: primaryColor
                }}
                size="lg"
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