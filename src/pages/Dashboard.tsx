import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingWrapper } from "@/components/LoadingWrapper";
import { ReviewService } from "@/services/reviewService";
import { InvoiceService } from "@/services/invoiceService";
import { FileText, Receipt, Star, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@/types";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    averageRating: 0,
    totalInvoices: 0,
    highRatingReviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [reviewStatsResponse, invoiceStatsResponse] = await Promise.all([
          ReviewService.getReviewStats(),
          InvoiceService.getInvoiceStats()
        ]);

        if (reviewStatsResponse.success && invoiceStatsResponse.success) {
          setStats({
            totalReviews: reviewStatsResponse.data!.totalReviews,
            averageRating: reviewStatsResponse.data!.averageRating,
            totalInvoices: invoiceStatsResponse.data!.totalInvoices,
            highRatingReviews: reviewStatsResponse.data!.highRatingReviews
          });
        } else {
          console.error('Error fetching stats:', {
            reviewError: reviewStatsResponse.error,
            invoiceError: invoiceStatsResponse.error
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <LoadingWrapper loading={loading} error={null} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your business metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Customer feedback received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= stats.averageRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Ratings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRatingReviews}</div>
            <p className="text-xs text-muted-foreground">
              4+ star reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Invoices generated
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Review</Badge>
                <span className="text-sm">New customer review received</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Invoice</Badge>
                <span className="text-sm">Invoice template updated</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left p-2 rounded-md hover:bg-accent text-sm">
                Create new invoice
              </button>
              <button className="w-full text-left p-2 rounded-md hover:bg-accent text-sm">
                View recent reviews
              </button>
              <button className="w-full text-left p-2 rounded-md hover:bg-accent text-sm">
                Export data
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </LoadingWrapper>
  );
};

export default Dashboard;