import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserInvitationService } from '@/services/userInvitationService';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  MailIcon,
  KeyIcon,
  BuildingIcon,
  ShieldIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const acceptInvitationSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

export function InvitationAcceptance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Fetch invitation details
  const { 
    data: invitationData, 
    isLoading: invitationLoading, 
    error: invitationError 
  } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => {
      if (!token) throw new Error('No invitation token provided');
      return UserInvitationService.getInvitationByToken(token);
    },
    enabled: !!token,
    retry: false,
  });

  const invitation = invitationData?.data;

  const acceptInvitationMutation = useMutation({
    mutationFn: async (data: AcceptInvitationFormData) => {
      if (!token) throw new Error('No invitation token');
      
      const response = await UserInvitationService.acceptInvitation(token, data.password);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to accept invitation');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Account Created Successfully!",
        description: `Welcome to ${invitation?.tenant?.name}! You can now access your dashboard.`,
      });

      // Redirect based on user role
      if (data.invitation.role === 'super_admin') {
        navigate('/master');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Account",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AcceptInvitationFormData) => {
    acceptInvitationMutation.mutate(data);
  };

  // Handle missing or invalid token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              No invitation token was provided in the URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (invitationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or invalid invitation
  if (invitationError || !invitationData?.success || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invitation Invalid</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">
            Complete Your Setup
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join <strong>{invitation.tenant?.name}</strong>
          </p>
        </div>

        {/* Invitation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invitation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <MailIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{invitation.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <BuildingIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-muted-foreground">{invitation.tenant?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ShieldIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {invitation.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Password</CardTitle>
            <CardDescription>
              Choose a secure password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a secure password"
                            className="pl-10 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters long
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pl-10 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={acceptInvitationMutation.isPending}
                >
                  {acceptInvitationMutation.isPending ? (
                    <>
                      <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Create Account & Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
