import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Home, MessageSquare } from 'lucide-react';

interface LocationState {
  name: string;
  rating: number;
}

export default function FeedbackThankYouPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const reviewData = location.state as LocationState;

  useEffect(() => {
    // If no review data, redirect to home
    if (!reviewData?.name) {
      navigate('/');
    }
  }, [reviewData, navigate]);

  if (!reviewData) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              Thank You, {reviewData.name}!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Your feedback has been received and will help us improve our service.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Your Feedback Matters
              </h3>
              <p className="text-green-700">
                We truly appreciate you taking the time to share your thoughts. 
                Your input helps us understand what we can do better and ensures 
                we provide the best possible experience for all our customers.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <span>Your rating:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= reviewData.rating
                        ? 'text-orange-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span>({reviewData.rating} out of 5)</span>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold">What happens next?</h4>
              <div className="text-left space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <p className="text-gray-700">
                    Our team will review your feedback and identify areas for improvement.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <p className="text-gray-700">
                    We'll implement changes based on your suggestions where possible.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <p className="text-gray-700">
                    We'll continue to monitor and improve our service based on all feedback.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-gray-500 mb-4">
                If you have any urgent concerns or questions, please don't hesitate to contact us directly.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto"
                size="lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}