import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, ExternalLink, Home } from 'lucide-react';

interface LocationState {
  name: string;
  rating: number;
}

export default function ReviewThankYouPage() {
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
                  <Star className="h-4 w-4" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              Thank You, {reviewData.name}!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Your review has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Review Submitted Successfully
              </h3>
              <p className="text-green-700">
                Thank you for taking the time to share your experience with us. 
                Your feedback is valuable and helps us maintain high standards of service.
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
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span>({reviewData.rating} out of 5)</span>
            </div>

            {reviewData.rating >= 4 && (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Help Us Spread the Word
                </h3>
                <p className="text-blue-700 mb-4">
                  Since you had a great experience, would you consider sharing your review on Google? 
                  It helps other customers discover our business and helps us grow.
                </p>
                <Button
                  onClick={() => window.open('https://g.page/r/CZEmfT3kD-k-EBM/review', '_blank')}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Leave a Google Review
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-lg font-semibold">What happens next?</h4>
              <div className="text-left space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <p className="text-gray-700">
                    Your review will be visible to other customers and potential clients.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <p className="text-gray-700">
                    Our team will review your feedback and use it to improve our services.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <p className="text-gray-700">
                    We may reach out to you if we have any follow-up questions about your experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-gray-500 mb-4">
                Thank you for being a valued customer. We appreciate your business!
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