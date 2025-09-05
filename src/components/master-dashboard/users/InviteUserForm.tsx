import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { UserInvitationService } from '@/services/userInvitationService';
import { TenantService } from '@/services/tenantService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeftIcon,
  MailIcon,
  UserPlusIcon,
  Building2Icon,
  ShieldIcon,
  LoaderIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['user', 'tenant_admin'], {
    required_error: 'Please select a role',
  }),
  tenant_id: z.string().min(1, 'Please select a tenant'),
  message: z.string().optional(),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

export function InviteUserForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role: 'user',
      tenant_id: '',
      message: '',
    },
  });

  // Fetch tenants for selection
  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', 1, 50], // Get first 50 tenants
    queryFn: () => TenantService.getTenants(1, 50),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const tenants = tenantsData?.data?.tenants || [];

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserFormData) => {
      const response = await UserInvitationService.createInvitation({
        email: data.email,
        role: data.role,
        tenant_id: data.tenant_id,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send invitation');
      }

      return response.data;
    },
    onSuccess: (invitation) => {
      toast({
        title: "Invitation Sent Successfully",
        description: `Invitation has been sent to ${invitation?.email}. They will receive an email with setup instructions.`,
      });

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });

      // Navigate back to user directory
      navigate('/master/users');
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Invitation",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteUserFormData) => {
    inviteUserMutation.mutate(data);
  };

  const selectedTenant = tenants.find(t => t.id === form.watch('tenant_id'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/master/users">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite New User</h1>
          <p className="text-muted-foreground">
            Send an invitation to create a new user account
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invitation Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlusIcon className="h-5 w-5" />
              <span>User Details</span>
            </CardTitle>
            <CardDescription>
              Enter the details for the new user invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="user@example.com"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The user will receive an invitation email at this address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tenant Selection */}
                <FormField
                  control={form.control}
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tenant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenantsLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading tenants...
                            </SelectItem>
                          ) : tenants.length > 0 ? (
                            tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                <div className="flex items-center space-x-2">
                                  <Building2Icon className="h-4 w-4" />
                                  <span>{tenant.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No tenants available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The tenant organization this user will belong to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">
                            <div className="flex items-center space-x-2">
                              <ShieldIcon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">User</div>
                                <div className="text-sm text-muted-foreground">
                                  Standard user with basic permissions
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="tenant_admin">
                            <div className="flex items-center space-x-2">
                              <ShieldIcon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Tenant Admin</div>
                                <div className="text-sm text-muted-foreground">
                                  Admin with full tenant management permissions
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The role determines what permissions the user will have
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Optional Message */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Welcome Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a personal welcome message for the new user..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This message will be included in the invitation email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" type="button" asChild>
                    <Link to="/master/users">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={inviteUserMutation.isPending}>
                    {inviteUserMutation.isPending ? (
                      <>
                        <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                        Sending Invitation...
                      </>
                    ) : (
                      <>
                        <MailIcon className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview/Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invitation Preview</CardTitle>
            <CardDescription>
              Summary of the invitation being sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-sm">{form.watch('email') || 'Not specified'}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Tenant</Label>
              <p className="text-sm">{selectedTenant?.name || 'Not selected'}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Role</Label>
              <p className="text-sm capitalize">
                {form.watch('role')?.replace('_', ' ') || 'Not selected'}
              </p>
            </div>

            {form.watch('message') && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Message</Label>
                <p className="text-sm text-muted-foreground">
                  {form.watch('message').slice(0, 100)}
                  {form.watch('message').length > 100 && '...'}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium text-muted-foreground">What happens next?</Label>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                <li>• User receives invitation email</li>
                <li>• They click the setup link</li>
                <li>• They create their password</li>
                <li>• Account is activated automatically</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
