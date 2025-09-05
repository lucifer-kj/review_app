import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function TenantDetails() {
  const { tenantId } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/master/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenant Details</h2>
          <p className="text-muted-foreground">
            Tenant ID: {tenantId}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
            <CardDescription>
              Basic tenant organization details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Organization Name</label>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>
              Tenant usage and activity metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Total Users</label>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Reviews</label>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
              <div>
                <label className="text-sm font-medium">Last Activity</label>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage this tenant organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button variant="outline">Edit Settings</Button>
            <Button variant="outline">View Users</Button>
            <Button variant="outline">Usage Reports</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
