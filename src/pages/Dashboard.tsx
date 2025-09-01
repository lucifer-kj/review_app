import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SendReviewEmailDialog } from "@/components/SendReviewEmailDialog";
import { FileText, Receipt, Star, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  totalInvoices: number;
  highRatingReviews: number;
}

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
        // Get reviews stats
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating');

        if (reviewsError) throw reviewsError;

        // Get invoices count
        const { count: invoiceCount, error: invoicesError } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true });

        if (invoicesError) throw invoicesError;

        const totalReviews = reviews?.length || 0;
        const averageRating = totalReviews > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
          : 0;
        const highRatingReviews = reviews?.filter(r => r.rating >= 4).length || 0;

        setStats({
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          totalInvoices: invoiceCount || 0,
          highRatingReviews
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <SendReviewEmailDialog />
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
    </div>
  );
};

export default Dashboard;