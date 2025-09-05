import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserInvitationService } from '@/services/userInvitationService';
import { useToast } from '@/components/ui/use-toast';
import type { CreateInvitationData } from '@/types/tenant.types';

/**
 * Hook to fetch all users across platform (super admin only)
 */
export function useUsers(
  page: number = 1,
  limit: number = 20,
  filters: { search?: string; role?: string; status?: string } = {}
) {
  return useQuery({
    queryKey: ['users', page, limit, filters],
    queryFn: () => UserInvitationService.getAllUsers(page, limit, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch invitations for a tenant
 */
export function useInvitations(
  tenantId?: string,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['invitations', tenantId, page, limit],
    queryFn: () => UserInvitationService.getInvitations(tenantId, page, limit),
    enabled: !!tenantId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch invitation by token
 */
export function useInvitationByToken(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => UserInvitationService.getInvitationByToken(token),
    enabled: !!token,
    retry: false,
    staleTime: 0, // Don't cache invitation tokens
    gcTime: 0, // Don't keep in cache
  });
}

/**
 * Hook to create a new invitation
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateInvitationData) => 
      UserInvitationService.createInvitation(data),
    onSuccess: (response, variables) => {
      if (response.success) {
        toast({
          title: "Invitation Sent",
          description: `Invitation has been sent to ${variables.email}`,
        });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['invitations'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Invitation",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to accept an invitation
 */
export function useAcceptInvitation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      UserInvitationService.acceptInvitation(token, password),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const invitation = response.data.invitation;
        toast({
          title: "Account Created Successfully!",
          description: `Welcome! Your account has been set up.`,
        });
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
}

/**
 * Hook to resend an invitation
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (invitationId: string) =>
      UserInvitationService.resendInvitation(invitationId),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Invitation Resent",
          description: "The invitation has been resent successfully",
        });

        // Invalidate invitations queries
        queryClient.invalidateQueries({ queryKey: ['invitations'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Resend Invitation",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete an invitation
 */
export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (invitationId: string) =>
      UserInvitationService.deleteInvitation(invitationId),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Invitation Deleted",
          description: "The invitation has been deleted successfully",
        });

        // Invalidate invitations queries
        queryClient.invalidateQueries({ queryKey: ['invitations'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Invitation",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    },
  });
}

/**
 * Convenience hooks for specific operations
 */

// Hook for invitation management in tenant context
export function useTenantInvitations(tenantId: string) {
  const invitations = useInvitations(tenantId);
  const createInvitation = useCreateInvitation();
  const resendInvitation = useResendInvitation();
  const deleteInvitation = useDeleteInvitation();

  return {
    invitations: invitations.data?.data?.invitations || [],
    totalInvitations: invitations.data?.data?.total || 0,
    isLoading: invitations.isLoading,
    error: invitations.error,
    refetch: invitations.refetch,
    createInvitation: createInvitation.mutate,
    resendInvitation: resendInvitation.mutate,
    deleteInvitation: deleteInvitation.mutate,
    isCreating: createInvitation.isPending,
    isResending: resendInvitation.isPending,
    isDeleting: deleteInvitation.isPending,
  };
}

// Hook for user management in master dashboard
export function useMasterUserManagement(
  page: number = 1,
  limit: number = 20,
  filters: { search?: string; role?: string; status?: string } = {}
) {
  const users = useUsers(page, limit, filters);
  const createInvitation = useCreateInvitation();

  return {
    users: users.data?.data?.users || [],
    totalUsers: users.data?.data?.total || 0,
    totalPages: users.data?.data?.total_pages || 0,
    isLoading: users.isLoading,
    error: users.error,
    refetch: users.refetch,
    createInvitation: createInvitation.mutate,
    isCreatingInvitation: createInvitation.isPending,
  };
}
