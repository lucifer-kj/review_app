import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Building2, Loader2, Save, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MasterDashboardService } from "@/services/masterDashboardService";
import { TenantService } from "@/services/tenantService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function TenantSettings() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    plan_type: "basic" as "basic" | "pro" | "enterprise",
    billing_email: "",
    status: "active" as "active" | "suspended" | "pending",
    settings: {
      description: "",
      features: {
        analytics: true,
        custom_domain: false,
        api_access: false,
        priority_support: false,
      },
      limits: {
        max_users: 10,
        max_reviews: 1000,
        storage_limit: 1024, // MB
      }
    }
  });

  // Fetch tenant details
  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant-details', tenantId],
    queryFn: () => MasterDashboardService.getTenantDetails(tenantId!),
    enabled: !!tenantId,
  });

  // Update form data when tenant is loaded
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        domain: tenant.domain || "",
        plan_type: tenant.plan_type || "basic",
        billing_email: tenant.billing_email || "",
        status: tenant.status || "active",
        settings: {
          description: tenant.settings?.description || "",
          features: {
            analytics: tenant.settings?.features?.analytics ?? true,
            custom_domain: tenant.settings?.features?.custom_domain ?? false,
            api_access: tenant.settings?.features?.api_access ?? false,
            priority_support: tenant.settings?.features?.priority_support ?? false,
          },
          limits: {
            max_users: tenant.settings?.limits?.max_users || 10,
            max_reviews: tenant.settings?.limits?.max_reviews || 1000,
            storage_limit: tenant.settings?.limits?.storage_limit || 1024,
          }
        }
      });
    }
  }, [tenant]);

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const result = await TenantService.updateTenant(tenantId!, {
        name: data.name,
        domain: data.domain || undefined,
        plan_type: data.plan_type,
        billing_email: data.billing_email,
        status: data.status,
        settings: data.settings,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update tenant');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Tenant settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ['tenant-details', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update tenant settings");
    },
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async () => {
      const result = await TenantService.deleteTenant(tenantId!);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete tenant');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Tenant deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-analytics'] });
      // Redirect to tenants list
      window.location.href = '/master/tenants';
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete tenant");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/master/tenants/${tenantId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenant Details
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Tenant Settings</h2>
            <p className="text-muted-foreground">Loading tenant information...</p>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/master/tenants/${tenantId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenant Details
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Tenant Settings</h2>
            <p className="text-muted-foreground">Failed to load tenant information</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load tenant details. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/master/tenants/${tenantId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenant Details
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Tenant Settings</h2>
          <p className="text-muted-foreground">
            Update configuration and settings for {tenant.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Core tenant organization details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  required
                  disabled={updateTenantMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain (Optional)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="company.com"
                  disabled={updateTenantMutation.isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan_type">Plan Type</Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={(value) => handleInputChange('plan_type', value)}
                  disabled={updateTenantMutation.isPending}
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
                <Label htmlFor="billing_email">Billing Email</Label>
                <Input
                  id="billing_email"
                  type="email"
                  value={formData.billing_email}
                  onChange={(e) => handleInputChange('billing_email', e.target.value)}
                  placeholder="billing@company.com"
                  disabled={updateTenantMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={updateTenantMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              Enable or disable features for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable analytics and reporting features
                  </p>
                </div>
                <Switch
                  checked={formData.settings.features.analytics}
                  onCheckedChange={(checked) => handleInputChange('settings.features.analytics', checked)}
                  disabled={updateTenantMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Custom Domain</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow custom domain configuration
                  </p>
                </div>
                <Switch
                  checked={formData.settings.features.custom_domain}
                  onCheckedChange={(checked) => handleInputChange('settings.features.custom_domain', checked)}
                  disabled={updateTenantMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable API access for integrations
                  </p>
                </div>
                <Switch
                  checked={formData.settings.features.api_access}
                  onCheckedChange={(checked) => handleInputChange('settings.features.api_access', checked)}
                  disabled={updateTenantMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Priority Support</Label>
                  <p className="text-sm text-muted-foreground">
                    Provide priority customer support
                  </p>
                </div>
                <Switch
                  checked={formData.settings.features.priority_support}
                  onCheckedChange={(checked) => handleInputChange('settings.features.priority_support', checked)}
                  disabled={updateTenantMutation.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>
              Set usage limits for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.settings.limits.max_users}
                  onChange={(e) => handleInputChange('settings.limits.max_users', parseInt(e.target.value))}
                  min="1"
                  disabled={updateTenantMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_reviews">Max Reviews</Label>
                <Input
                  id="max_reviews"
                  type="number"
                  value={formData.settings.limits.max_reviews}
                  onChange={(e) => handleInputChange('settings.limits.max_reviews', parseInt(e.target.value))}
                  min="1"
                  disabled={updateTenantMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_limit">Storage Limit (MB)</Label>
                <Input
                  id="storage_limit"
                  type="number"
                  value={formData.settings.limits.storage_limit}
                  onChange={(e) => handleInputChange('settings.limits.storage_limit', parseInt(e.target.value))}
                  min="1"
                  disabled={updateTenantMutation.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>
              Additional information about this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.settings.description}
                onChange={(e) => handleInputChange('settings.description', e.target.value)}
                placeholder="Brief description of the organization"
                rows={3}
                disabled={updateTenantMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {updateTenantMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {updateTenantMutation.error?.message || "Failed to update tenant settings"}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              disabled={updateTenantMutation.isPending}
            >
              {updateTenantMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {updateTenantMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              asChild
              disabled={updateTenantMutation.isPending}
            >
              <Link to={`/master/tenants/${tenantId}`}>Cancel</Link>
            </Button>
          </div>
          
          {/* Delete Tenant Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                type="button" 
                variant="destructive" 
                disabled={updateTenantMutation.isPending || deleteTenantMutation.isPending}
              >
                {deleteTenantMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Tenant
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the tenant
                  "{tenant?.name}" and all associated data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All user accounts in this tenant</li>
                    <li>All reviews and customer data</li>
                    <li>All business settings and configurations</li>
                    <li>All usage metrics and analytics</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTenantMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, delete tenant
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  );
}
