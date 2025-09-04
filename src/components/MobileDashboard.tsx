import { Card } from "@/components/ui/card";
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
          <h1 className="text-xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>

        {/* Hero Metrics - Stack on Mobile */}
        <div className="w-full space-y-4">
          <Card className="w-full p-4 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-sm">Total Reviews</span>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1 text-blue-700">{stats.totalReviews}</div>
            <p className="text-xs text-blue-600/80">Customer feedback received</p>
          </Card>

          <Card className="w-full p-4 shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-500 rounded-lg shadow-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-sm">Average Rating</span>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1 text-yellow-700">{stats.averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-3 w-3",
                    star <= Math.round(stats.averageRating)
                      ? "text-yellow-500 fill-current"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </Card>

          <Card className="w-full p-4 shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500 rounded-lg shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-sm">High Ratings</span>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-700">{stats.highRatingReviews}</div>
            <p className="text-xs text-green-600/80">4-5 star reviews</p>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3">
          <Button onClick={onSendReview} className="flex-1 h-12 text-sm font-semibold shadow-lg">
            <Mail className="h-4 w-4 mr-2" />
            Send Review
          </Button>
          <Button onClick={onViewReviews} variant="outline" className="flex-1 h-12 text-sm font-semibold shadow-lg border-2">
            <FileText className="h-4 w-4 mr-2" />
            View Reviews
          </Button>
        </div>
      </div>
    </div>
  );
};
