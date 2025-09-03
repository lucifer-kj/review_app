import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingWrapper } from "@/components/LoadingWrapper";
import { ReviewService } from "@/services/reviewService";
import { InvoiceService } from "@/services/invoiceService";
import { FileText, Receipt, Star, TrendingUp, Plus, Download, Eye } from "lucide-react";
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
    <LoadingWrapper loading={loading} error={null} className="space-section">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="mobile-heading font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="mobile-text text-muted-foreground text-body">
              Welcome back! Here's an overview of your business metrics.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Invoice
            </button>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-foreground">Total Reviews</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground text-body">
                Customer feedback received
              </p>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-foreground">Average Rating</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{stats.averageRating.toFixed(1)}</div>
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

          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-foreground">High Ratings</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{stats.highRatingReviews}</div>
              <p className="text-xs text-muted-foreground text-body">
                4+ star reviews
              </p>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold text-foreground">Total Invoices</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Receipt className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground text-body">
                Invoices generated
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Recent Activity</CardTitle>
              <CardDescription className="text-sm text-body">
                Latest updates from your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-all duration-300">
                  <Badge variant="success" className="flex-shrink-0">Review</Badge>
                  <span className="text-sm text-foreground">New customer review received</span>
                  <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-all duration-300">
                  <Badge variant="info" className="flex-shrink-0">Invoice</Badge>
                  <span className="text-sm text-foreground">Invoice template updated</span>
                  <span className="text-xs text-muted-foreground ml-auto">1d ago</span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-all duration-300">
                  <Badge variant="warning" className="flex-shrink-0">System</Badge>
                  <span className="text-sm text-foreground">Backup completed successfully</span>
                  <span className="text-xs text-muted-foreground ml-auto">3d ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-sm text-body">
                Common tasks you might want to perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-all duration-300 text-sm text-foreground hover:scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Create new invoice</span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-all duration-300 text-sm text-foreground hover:scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <span>View recent reviews</span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-all duration-300 text-sm text-foreground hover:scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Download className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Export data</span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LoadingWrapper>
  );
};

export default Dashboard;