import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingWrapper } from "@/components/LoadingWrapper";
import { MagicCard } from "@/components/ui/magic-card";
import { BarChart3, FileText, Star, Plus, Eye, Download, Mail, HelpCircle, MessageSquare, Settings, AlertCircle } from "lucide-react";
import { SendReviewEmailDialog } from "@/components/SendReviewEmailDialog";
import { useNavigate } from "react-router-dom";
import { ReviewService } from "@/services/reviewService";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { MobileDashboard } from "@/components/MobileDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  highRatingReviews: number;
}

interface RecentActivity {
  id: string;
  type: 'review' | 'feedback' | 'email_sent';
  message: string;
  timestamp: string;
  rating?: number;
  customerName?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    averageRating: 0,
    highRatingReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        
        // Fetch stats with error handling
        const statsResponse = await ReviewService.getReviewStats();
        
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          console.warn('Stats fetch warning:', statsResponse.error);
          // Don't set error for stats, just use defaults
          setStats({
            totalReviews: 0,
            averageRating: 0,
            highRatingReviews: 0,
          });
        }

        // Fetch recent reviews for activity feed with error handling
        const reviewsResponse = await ReviewService.getReviews();
        
        if (reviewsResponse.success && reviewsResponse.data) {
          const activities: RecentActivity[] = reviewsResponse.data.slice(0, 5).map(review => ({
            id: review.id,
            type: review.feedback ? 'feedback' : 'review',
            message: review.feedback 
              ? `Feedback received from ${review.name}`
              : `Review received from ${review.name}`,
            timestamp: review.created_at,
            rating: review.rating,
            customerName: review.name
          }));
          
          setRecentActivities(activities);
        } else {
          console.warn('Reviews fetch warning:', reviewsResponse.error);
          // Don't set error for reviews, just use empty array
          setRecentActivities([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchData();
  };

  // If there's an error, show error state
  if (error) {
    return (
      <div className="w-full p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-3">
          <Button onClick={handleRetry} variant="default">
            Try Again
          </Button>
          <Button onClick={() => navigate("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LoadingWrapper loading={loading} error={null} className="w-full">
      {/* Mobile Dashboard */}
      <MobileDashboard 
        stats={stats}
        onSendReview={() => setShowReviewDialog(true)}
        onViewReviews={() => navigate("/reviews")}
      />
      
      {/* Desktop Dashboard */}
      <div className="hidden lg:block w-full space-y-6 p-6"> 
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground pt-5 tracking-tight">Dashboard</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Welcome to your review management dashboard! Here you can track your business metrics and manage customer feedback.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your business metrics.
            </p>
          </div>
          <div className="flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowReviewDialog(true)}
                  size="lg"
                  className="flex items-center gap-3"
                >
                  <Mail className="h-5 w-5" />
                  Send Review Request
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send personalized review requests to your customers via email. They'll receive a link to leave a review on your website.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => navigate("/reviews")}
                  size="lg"
                  variant="outline"
                  className="flex items-center gap-3"
                >
                  <FileText className="h-5 w-5" />
                  View Reviews
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View and manage all customer reviews and feedback in the reviews table.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <MagicCard className="p-6 cursor-help">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-foreground">Total Reviews</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-2xl font-bold text-foreground">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                Total customer reviews received
              </p>
            </CardContent>
          </MagicCard>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of reviews and feedback received from customers.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <MagicCard className="p-6 cursor-help">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-foreground">Average Rating</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-2xl font-bold text-foreground">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Average customer rating
              </p>
            </CardContent>
          </MagicCard>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average rating from all customer reviews (1-5 stars).</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <MagicCard className="p-6 cursor-help">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-foreground">High Rating Reviews</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-2xl font-bold text-foreground">{stats.highRatingReviews}</div>
              <p className="text-xs text-muted-foreground">
                Reviews with 4+ stars
              </p>
            </CardContent>
          </MagicCard>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of reviews with 4 or 5 star ratings.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest customer interactions and reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        {activity.type === 'review' ? (
                          <Star className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.rating && (
                            <Badge variant="secondary" className="text-xs">
                              {activity.rating} stars
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start by sending review requests to your customers
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="space-y-3">
                <Button
                  onClick={() => setShowReviewDialog(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Review Request
                </Button>
                
                <Button
                  onClick={() => navigate("/reviews")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Reviews
                </Button>
                
                <Button
                  onClick={() => navigate("/settings")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Business Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SendReviewEmailDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        onSuccess={() => {
          setShowReviewDialog(false);
          // Refresh data after sending review request
          window.location.reload();
        }}
      />
    </LoadingWrapper>
  );
};

export default Dashboard;

function fetchData() {
  throw new Error("Function not implemented.");
}
