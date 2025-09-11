import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, User, Phone, Mail, Building2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function SimpleReviewForm() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Business Review URL for redirect
  const GOOGLE_REVIEW_URL = 'https://g.page/r/Cb1-ZHihwg4TEBM/review';

  const [formData, setFormData] = useState({
    name: '',
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
    setIsSubmitting(true);
    
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to submit a review.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number to submit a review.",
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
      // Show success message
      toast({
        title: "Review Submitted Successfully!",
        description: "Thank you for your feedback!",
      });

      // Handle redirect based on rating
      if (formData.rating >= 4) {
        // Show message and redirect to Google Reviews
        toast({
          title: "Redirecting to Google Reviews",
          description: "Please help us by leaving a review on Google!",
        });
        
        // Small delay to show the toast, then redirect
        setTimeout(() => {
          window.location.href = GOOGLE_REVIEW_URL;
        }, 1500);
      } else {
        // Navigate to thank you page for lower ratings
        navigate('/review/thank-you', {
          state: {
            name: formData.name,
            rating: formData.rating,
            businessName: 'Demo Business'
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card style={{ 
          borderColor: '#3b82f6',
          boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
        }}>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              <div>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  Demo Business
                </CardTitle>
                <p className="text-sm text-gray-500">demo.business.com</p>
              </div>
            </div>
            <CardDescription className="text-lg">
              Share your experience with Demo Business
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
                  How would you rate your experience with Demo Business? *
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
                      <div className="text-blue-800">
                        <p className="font-semibold mb-1">🌟 Great! Here's what happens next:</p>
                        <p>After submitting, you'll be redirected to Google Reviews to help others discover Demo Business.</p>
                        <div className="mt-2 flex items-center text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <span>You'll be taken to: g.page/r/Cb1-ZHihwg4TEBM/review</span>
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
                <Label htmlFor="reviewText" className="text-sm font-medium">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id="reviewText"
                  value={formData.reviewText}
                  onChange={(e) => handleInputChange('reviewText', e.target.value)}
                  placeholder="Tell us more about your experience with Demo Business..."
                  rows={4}
                  className="text-base"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-base py-3 bg-blue-600 hover:bg-blue-700"
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
