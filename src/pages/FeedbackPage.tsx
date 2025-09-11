import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { createClient } from '@supabase/supabase-js';

interface LocationState {
  name: string;
  rating: number;
  reviewId: string;
  businessName?: string;
}

export default function FeedbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState<LocationState | null>(null);

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    // Get data from navigation state or URL parameters
    const state = location.state as LocationState;
    const reviewId = searchParams.get('review_id');
    const name = searchParams.get('name');
    const rating = searchParams.get('rating');
    const businessName = searchParams.get('business_name');

    if (state?.name && state?.rating && state?.reviewId) {
      // Data from navigation state (preferred)
      setReviewData(state);
    } else if (reviewId && name && rating) {
      // Data from URL parameters
      setReviewData({
        reviewId,
        name: decodeURIComponent(name),
        rating: parseInt(rating),
        businessName: businessName ? decodeURIComponent(businessName) : undefined
      });
    } else {
      // If no data available, redirect to home
      navigate('/');
    }
  }, [location.state, searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewData) return;

    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide some feedback to help us improve.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the review with detailed feedback
      const { error } = await supabase
        .from('reviews')
        .update({
          feedback_text: feedback.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewData.reviewId);

      if (error) {
        console.error('Error updating review:', error);
        throw new Error('Failed to submit feedback');
      }

      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted successfully.",
      });
      
      // Navigate to thank you page
      navigate('/review/feedback-thank-you', {
        state: {
          name: reviewData.name,
          rating: reviewData.rating,
          businessName: reviewData.businessName
        }
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <CardTitle className="text-3xl font-bold">Help Us Improve</CardTitle>
                <CardDescription className="text-lg">
                  We value your feedback, {reviewData.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <span className="text-sm font-medium text-orange-800 mr-2">Your Rating:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= reviewData.rating
                          ? 'text-orange-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-orange-700 text-center">
                We noticed you rated us {reviewData.rating} out of 5 stars. 
                We'd love to hear how we can improve your experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-sm font-medium">
                  What could we do better? *
                </Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Please share your thoughts on how we can improve our service..."
                  rows={6}
                  className="text-base"
                  required
                />
                <p className="text-sm text-gray-500">
                  Your feedback helps us provide better service to all our customers.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Your feedback is confidential and will be used to improve our services.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}