import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function InviteUserForm() {
  const [formData, setFormData] = useState({
    email: "",
    role: "user",
    tenantId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement user invitation logic
    console.log("Inviting user:", formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/master/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invite User</h2>
          <p className="text-muted-foreground">
            Send an invitation to a new platform user
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Invitation</CardTitle>
          <CardDescription>
            Enter the details for the user invitation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter user email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="user">User</option>
                <option value="tenant_admin">Tenant Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                placeholder="Enter tenant ID (optional)"
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit">
                <UserPlus className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/master/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
