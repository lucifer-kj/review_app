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
import { MagicLinkService } from "@/services/magicLinkService";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TenantCreateWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    planType: "basic",
    description: "",
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create tenant workspace only
      const tenantResult = await TenantService.createTenant({
        name: data.name,
        domain: data.domain,
        plan_type: data.planType as 'basic' | 'pro' | 'enterprise',
        settings: {
          description: data.description,
        },
      });

      if (!tenantResult.success || !tenantResult.data) {
        throw new Error(tenantResult.error || 'Failed to create tenant');
      }

      return {
        tenant: tenantResult.data,
        success: true,
      };
    },
    onSuccess: (result) => {
      toast.success("Tenant workspace created successfully! You can now invite users to this workspace.", {
        description: "Click 'Invite User' to add admin and regular users to this workspace.",
        duration: 5000
      });
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
          <CardTitle>Create Tenant Workspace</CardTitle>
          <CardDescription>
            Create a new isolated workspace for an organization. You can invite users to this workspace after creation.
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
                {createTenantMutation.isPending ? "Creating Workspace..." : "Create Workspace"}
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
