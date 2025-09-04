import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, FileText, Mail, Plus, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDashboardProps {
  stats: {
    totalReviews: number;
    averageRating: number;
    highRatingReviews: number;
  };
  onSendReview: () => void;
  onViewReviews: () => void;
}

export const MobileDashboard = ({ stats, onSendReview, onViewReviews }: MobileDashboardProps) => {
  return (
    <div className="lg:hidden w-full min-h-screen bg-background">
      {/* Mobile Content Container */}
      <div className="w-full px-4 py-6 space-y-6 pb-24 pt-20">
        {/* Page Title */}
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back! Here's your business overview.
          </p>
        </div>

        {/* Hero Metrics - Stack on Mobile */}
        <div className="w-full space-y-4">
          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-5 w-5" />
                Total Reviews
              </CardTitle>
              <CardDescription className="text-sm">
                Customer feedback received
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="text-3xl font-bold">{stats.totalReviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Star className="h-5 w-5" />
                Average Rating
              </CardTitle>
              <CardDescription className="text-sm">
                Overall customer satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="text-3xl font-bold mb-2">{stats.averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-4 w-4",
                      star <= Math.round(stats.averageRating)
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5" />
                High Ratings
              </CardTitle>
              <CardDescription className="text-sm">
                4-5 star reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="text-3xl font-bold">{stats.highRatingReviews}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-center gap-4">
          <Button onClick={onSendReview} size="lg" className="flex-1 max-w-xs text-sm font-semibold">
            <Mail className="h-4 w-4 mr-2" />
            Send Review Request
          </Button>
          <Button onClick={onViewReviews} variant="outline" size="lg" className="flex-1 max-w-xs text-sm font-semibold">
            <FileText className="h-4 w-4 mr-2" />
            View All Reviews
          </Button>
        </div>
      </div>
    </div>
  );
};
