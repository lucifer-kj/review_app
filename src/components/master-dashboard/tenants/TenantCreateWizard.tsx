import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, Loader2, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TenantService } from "@/services/tenantService";
import { InvitationService } from "@/services/invitationService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TenantCreateWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    adminEmail: "",
    planType: "basic",
    description: "",
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Step 1: Create the tenant
      const tenantResult = await TenantService.createTenant({
        name: data.name,
        domain: data.domain || undefined,
        plan_type: data.planType as 'basic' | 'pro' | 'enterprise',
        settings: { description: data.description },
        billing_email: data.adminEmail,
      });

      if (!tenantResult.success || !tenantResult.data) {
        throw new Error(tenantResult.error || 'Failed to create tenant');
      }

      const tenant = tenantResult.data;

      // Step 2: Create user and send invitation
      const userResult = await InvitationService.createUserAndInvite(
        data.adminEmail,
        data.name,
        tenant.id,
        'tenant_admin'
      );

      if (!userResult.success) {
        throw new Error(userResult.error || 'Failed to create admin user');
      }

      return {
        tenant,
        invitation: userResult.data,
        success: true,
      };
    },
    onSuccess: (result) => {
      const message = result.invitation.emailSent 
        ? "Tenant created successfully! Invitation email sent to admin."
        : "Tenant created successfully! Admin invitation created.";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-analytics'] });
      navigate(`/master/tenants/${result.tenant.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tenant");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenantMutation.mutate(formData);
  };

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
          <h2 className="text-3xl font-bold tracking-tight">Create New Tenant</h2>
          <p className="text-muted-foreground">
            Set up a new tenant organization
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
          <CardDescription>
            Enter the details for the new tenant organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {createTenantMutation.isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {createTenantMutation.error?.message || "Failed to create tenant"}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter organization name"
                  required
                  disabled={createTenantMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain (Optional)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="company.com"
                  disabled={createTenantMutation.isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@company.com"
                  required
                  disabled={createTenantMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  A user account will be created and they can login immediately
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planType">Plan Type</Label>
                <Select
                  value={formData.planType}
                  onValueChange={(value) => setFormData({ ...formData, planType: value })}
                  disabled={createTenantMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the organization"
                rows={3}
                disabled={createTenantMutation.isPending}
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createTenantMutation.isPending}
              >
                {createTenantMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="mr-2 h-4 w-4" />
                )}
                {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                asChild
                disabled={createTenantMutation.isPending}
              >
                <Link to="/master/tenants">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
