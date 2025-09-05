import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function UserDirectory() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Directory</h2>
          <p className="text-muted-foreground">
            Manage platform users and their access
          </p>
        </div>
        <Button asChild>
          <Link to="/master/users/invite">
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
          <CardDescription>
            View and manage all users across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No users yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by inviting your first user.
            </p>
            <Button asChild className="mt-4">
              <Link to="/master/users/invite">
                <Plus className="mr-2 h-4 w-4" />
                Invite First User
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
