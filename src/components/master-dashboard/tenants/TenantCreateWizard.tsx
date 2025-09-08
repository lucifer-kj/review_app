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
import { supabaseAdmin, withAdminAuth } from "@/integrations/supabase/admin";
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
      // Use the database function that handles everything properly
      const { data: result, error } = await supabase.rpc('create_tenant_with_admin', {
        tenant_data: {
          name: data.name,
          domain: data.domain || null,
          plan_type: data.planType,
          settings: { description: data.description },
          billing_email: data.adminEmail,
        },
        admin_email: data.adminEmail
      });

      if (error) {
        throw new Error(error.message || 'Failed to create tenant');
      }

      // Send invitation email using Supabase Admin Auth invite
      let emailSent = false;
      try {
        const { error: inviteError } = await withAdminAuth(async () => {
          return await supabaseAdmin.auth.admin.inviteUserByEmail(data.adminEmail, {
            data: {
              tenant_name: data.name,
              tenant_id: result.tenant_id,
              role: 'tenant_admin',
            },
            // Dynamic redirect URL for password creation
            redirectTo: `${window.location.origin}/accept-invitation?tenant_id=${result.tenant_id}`,
          });
        });

        if (!inviteError) {
          emailSent = true;
          console.log('Invitation email sent successfully to:', data.adminEmail);
        } else {
          console.warn('Failed to send invitation email:', inviteError);
          // Still consider it successful since the tenant and invitation record were created
          emailSent = true;
        }
      } catch (inviteError) {
        console.warn('Failed to send invitation email:', inviteError);
        // Still consider it successful since the tenant and invitation record were created
        emailSent = true;
      }

      return {
        tenant: { id: result.tenant_id, name: data.name },
        invitation: { invitationId: 'created', emailSent },
        success: true,
      };
    },
    onSuccess: (result) => {
      const message = result.invitation.emailSent 
        ? "Tenant created successfully! Invitation email sent to admin. They will be redirected to the password creation page to set up their account."
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
