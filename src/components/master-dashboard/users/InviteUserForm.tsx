import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, UserPlus, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserManagementService } from "@/services/userManagementService";
import { TenantService } from "@/services/tenantService";
import { toast } from "sonner";

export default function InviteUserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    role: "user" as "user" | "tenant_admin",
    tenantId: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available tenants
  const { data: tenants, isLoading: tenantsLoading, error: tenantsError } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => TenantService.getAllTenants(),
  });

  // Debug logging
  console.log('Tenants query result:', { tenants, tenantsLoading, tenantsError });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: (data: typeof formData) => UserManagementService.createInvitation({
      tenant_id: data.tenantId,
      email: data.email,
      role: data.role,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success("Invitation sent successfully!");
      navigate("/master/users");
    },
    onError: (error: any) => {
      console.error('Invitation creation error:', error);
      const errorMessage = error.message || error.error?.message || "Failed to send invitation";
      toast.error(`Invitation failed: ${errorMessage}`);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.tenantId) {
      newErrors.tenantId = "Please select a tenant";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createInvitationMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
              >
                <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant *</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) => handleInputChange("tenantId", value)}
                disabled={tenantsLoading}
              >
                <SelectTrigger className={errors.tenantId ? "border-red-500" : ""}>
                  <SelectValue placeholder={
                    tenantsLoading ? "Loading tenants..." : 
                    tenantsError ? "Error loading tenants" :
                    !tenants?.data?.length ? "No tenants available" :
                    "Select a tenant"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.data?.length > 0 ? (
                    tenants.data.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.plan_type})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-tenants" disabled>
                      {tenantsError ? "Error loading tenants" : "No tenants available"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.tenantId && (
                <p className="text-sm text-red-500">{errors.tenantId}</p>
              )}
              {tenantsError && (
                <p className="text-sm text-red-500">
                  Failed to load tenants: {tenantsError.message || 'Unknown error'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation..."
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This message will be included in the invitation email
              </p>
            </div>

            {createInvitationMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Invitation Failed</p>
                    <p>{createInvitationMutation.error.message || createInvitationMutation.error.error?.message || "Failed to send invitation"}</p>
                    {createInvitationMutation.error.message?.includes('ambiguous') && (
                      <div className="text-sm text-gray-600 mt-2">
                        <p><strong>Database Error:</strong> This usually indicates a SQL query issue with column references.</p>
                        <p><strong>Solution:</strong> Please apply the RLS fix script in your Supabase SQL editor.</p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/master/users">Cancel</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={createInvitationMutation.isPending}
              >
                {createInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}