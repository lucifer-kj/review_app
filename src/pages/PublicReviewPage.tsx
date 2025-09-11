import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';

interface TenantInfo {
  id: string;
  name: string;
  business_name: string;
  google_review_url: string;
  slug: string;
  review_url: string;
  branding: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  status: string;
}

interface ReviewFormData {
  reviewer_name: string;
  reviewer_email: string;
  reviewer_phone: string;
  rating: number;
  feedback_text: string;
}

export default function PublicReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  
  const [formData, setFormData] = useState<ReviewFormData>({
    reviewer_name: '',
    reviewer_email: '',
    reviewer_phone: '',
    rating: 0,
    feedback_text: ''
  });

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_tenant_by_slug', { slug_param: slug });

        if (error) {
          console.error('Error fetching tenant:', error);
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setLoading(false);
          return;
        }

        setTenant(data[0]);
      } catch (error) {
        console.error('Error fetching tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [slug, supabase]);

  const handleInputChange = (field: keyof ReviewFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStarClick = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenant || formData.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-public-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          slug: tenant.slug,
          reviewer_name: formData.reviewer_name || undefined,
          reviewer_email: formData.reviewer_email || undefined,
          reviewer_phone: formData.reviewer_phone || undefined,
          rating: formData.rating,
          feedback_text: formData.feedback_text || undefined,
          metadata: {
            source: 'public_form',
            user_agent: navigator.userAgent,
            referrer: document.referrer,
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Redirect based on rating
        if (formData.rating >= 4) {
          // High rating - redirect to Google Reviews
          window.location.href = tenant.google_review_url;
        } else {
          // Low rating - redirect to feedback form
          navigate('/feedback', {
            state: {
              reviewId: result.review_id,
              name: formData.reviewer_name || 'Anonymous',
              rating: formData.rating,
              businessName: tenant.business_name
            }
          });
        }
      } else {
        throw new Error(result.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading review form...</span>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Business not found or review form not available</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            {tenant.branding?.logo_url && (
              <div className="mb-4">
                <img 
                  src={tenant.branding.logo_url} 
                  alt={`${tenant.business_name} logo`}
                  className="h-16 w-auto mx-auto"
                />
              </div>
            )}
            <CardTitle className="text-2xl font-bold" style={{ color: tenant.branding?.primary_color }}>
              {tenant.business_name}
            </CardTitle>
            <CardDescription className="text-lg">
              We'd love to hear about your experience!
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Section */}
              <div className="space-y-2">
                <Label className="text-base font-medium">How would you rate your experience? *</Label>
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => handleStarClick(star)}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoveredStar || formData.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {formData.rating > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {formData.rating === 1 && 'Poor'}
                    {formData.rating === 2 && 'Fair'}
                    {formData.rating === 3 && 'Good'}
                    {formData.rating === 4 && 'Very Good'}
                    {formData.rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewer_name">Your Name (Optional)</Label>
                  <Input
                    id="reviewer_name"
                    type="text"
                    value={formData.reviewer_name}
                    onChange={(e) => handleInputChange('reviewer_name', e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reviewer_email">Email (Optional)</Label>
                  <Input
                    id="reviewer_email"
                    type="email"
                    value={formData.reviewer_email}
                    onChange={(e) => handleInputChange('reviewer_email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewer_phone">Phone (Optional)</Label>
                <Input
                  id="reviewer_phone"
                  type="tel"
                  value={formData.reviewer_phone}
                  onChange={(e) => handleInputChange('reviewer_phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback_text">Tell us more about your experience (Optional)</Label>
                <Textarea
                  id="feedback_text"
                  value={formData.feedback_text}
                  onChange={(e) => handleInputChange('feedback_text', e.target.value)}
                  placeholder="Share details about your experience..."
                  rows={4}
                />
              </div>

              {/* Rating-based information */}
              {formData.rating > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {formData.rating >= 4 ? (
                      <>
                        Great! After submitting, you'll be redirected to Google Reviews to share your experience publicly.
                        <ExternalLink className="inline h-4 w-4 ml-1" />
                      </>
                    ) : (
                      "We appreciate your feedback. After submitting, you'll be taken to a feedback form to help us improve."
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={submitting || formData.rating === 0}
                className="w-full"
                style={{ 
                  backgroundColor: tenant.branding?.primary_color,
                  color: tenant.branding?.secondary_color || 'white'
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Review...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
