import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function TenantList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenant Management</h2>
          <p className="text-muted-foreground">
            Manage tenant organizations and their settings
          </p>
        </div>
        <Button asChild>
          <Link to="/master/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Organizations</CardTitle>
          <CardDescription>
            View and manage all tenant organizations on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No tenants yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first tenant organization.
            </p>
            <Button asChild className="mt-4">
              <Link to="/master/tenants/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Tenant
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
