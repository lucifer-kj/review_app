import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, User, Phone, Mail } from 'lucide-react';
import { useReviewFlow } from '@/hooks/useReviewFlow';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InputValidator, InputSanitizer } from '@/utils/validation';

export default function ReviewFormPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubmitting, handleReviewSubmit, sanitizedUtmParams } = useReviewFlow();

  const [formData, setFormData] = useState({
    name: sanitizedUtmParams.customerName || '',
    phone: '',
    countryCode: '+1',
    rating: 0,
    reviewText: '',
  });

  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedData = {
      name: InputSanitizer.sanitizeText(formData.name),
      phone: InputSanitizer.sanitizePhone(formData.phone),
      countryCode: formData.countryCode,
      rating: formData.rating,
      reviewText: InputSanitizer.sanitizeText(formData.reviewText),
    };

    // Validate inputs
    const nameValidation = InputValidator.validateName(sanitizedData.name);
    if (!nameValidation.isValid) {
      toast({
        title: "Invalid Name",
        description: nameValidation.error,
        variant: "destructive",
      });
      return;
    }

    const phoneValidation = InputValidator.validatePhone(sanitizedData.phone, sanitizedData.countryCode);
    if (!phoneValidation.isValid) {
      toast({
        title: "Invalid Phone",
        description: phoneValidation.error,
        variant: "destructive",
      });
      return;
    }

    const ratingValidation = InputValidator.validateRating(sanitizedData.rating);
    if (!ratingValidation.isValid) {
      toast({
        title: "Invalid Rating",
        description: ratingValidation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      await handleReviewSubmit({
        name: sanitizedData.name,
        phone: sanitizedData.phone,
        countryCode: sanitizedData.countryCode,
        rating: sanitizedData.rating,
        tenantId: searchParams.get('tenant_id') || undefined,
      });
    } catch (error) {
      console.error('Review submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ErrorBoundary componentName="ReviewFormPage">
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Share Your Experience</CardTitle>
            <CardDescription className="text-lg">
              Your feedback helps us improve our service
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
                  How would you rate your experience? *
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
                  placeholder="Tell us more about your experience..."
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
        </div>
      </div>
    </ErrorBoundary>
  );
}