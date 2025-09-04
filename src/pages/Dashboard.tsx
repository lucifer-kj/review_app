import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingWrapper } from "@/components/LoadingWrapper";
import { MagicCard } from "@/components/ui/magic-card";
import { BarChart3, FileText, Star, Plus, Eye, Download, Mail, HelpCircle, MessageSquare, Settings } from "lucide-react";
import { SendReviewEmailDialog } from "@/components/SendReviewEmailDialog";
import { useNavigate } from "react-router-dom";
import { ReviewService } from "@/services/reviewService";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { MobileDashboard } from "@/components/MobileDashboard";

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
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await ReviewService.getReviewStats();
        
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          console.error('Error fetching stats:', statsResponse.error);
        }

        // Fetch recent reviews for activity feed
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
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              <div className="text-3xl font-bold text-foreground mb-2">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                Customer feedback received
              </p>
            </CardContent>
          </MagicCard>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of customer reviews collected through your review system.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <MagicCard className="p-6 cursor-help">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-foreground">Average Rating</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-3xl font-bold text-foreground mb-2">{stats.averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(stats.averageRating)
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
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
              <CardTitle className="text-sm font-semibold text-foreground">High Ratings</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-3xl font-bold text-foreground mb-2">{stats.highRatingReviews}</div>
              <p className="text-xs text-muted-foreground">
                4-5 star reviews
              </p>
            </CardContent>
          </MagicCard>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of reviews with 4 or 5 star ratings.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest customer interactions and reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-shrink-0">
                        {activity.type === 'review' && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Star className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        {activity.type === 'feedback' && (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                        {activity.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= activity.rating!
                                    ? "text-yellow-500 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground">Customer reviews and feedback will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowReviewDialog(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-3" />
                  Send Review Request
                </Button>
                <Button
                  onClick={() => navigate("/reviews")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  View All Reviews
                </Button>
                <Button
                  onClick={() => navigate("/settings")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Business Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Email Dialog */}
      <SendReviewEmailDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        onSuccess={() => {
          // Refresh data after sending email
          window.location.reload();
        }}
      />
    </LoadingWrapper>
  );
};

export default Dashboard;