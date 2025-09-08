-- Fix RLS policies for user_invitations table
-- This migration adds more permissive policies for invitation creation

-- Drop existing policies
DROP POLICY IF EXISTS "super_admin_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "tenant_admin_invitations" ON public.user_invitations;

-- Create new, more permissive policies for user_invitations

-- Super admin can do everything
CREATE POLICY "super_admin_invitations_all" ON public.user_invitations
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant admins can manage invitations for their tenant
CREATE POLICY "tenant_admin_invitations_all" ON public.user_invitations
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Allow authenticated users to create invitations (for master dashboard)
CREATE POLICY "authenticated_create_invitations" ON public.user_invitations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      public.is_super_admin(auth.uid()) OR
      public.is_tenant_admin(auth.uid(), tenant_id)
    )
  );

-- Allow authenticated users to read invitations they created or for their tenant
CREATE POLICY "authenticated_read_invitations" ON public.user_invitations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      public.is_super_admin(auth.uid()) OR
      invited_by = auth.uid() OR
      (
        tenant_id = public.get_current_tenant_id() AND
        public.is_tenant_admin(auth.uid(), tenant_id)
      )
    )
  );

-- Allow authenticated users to update invitations they created
CREATE POLICY "authenticated_update_invitations" ON public.user_invitations
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    (
      public.is_super_admin(auth.uid()) OR
      invited_by = auth.uid() OR
      (
        tenant_id = public.get_current_tenant_id() AND
        public.is_tenant_admin(auth.uid(), tenant_id)
      )
    )
  );

-- Allow authenticated users to delete invitations they created
CREATE POLICY "authenticated_delete_invitations" ON public.user_invitations
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    (
      public.is_super_admin(auth.uid()) OR
      invited_by = auth.uid() OR
      (
        tenant_id = public.get_current_tenant_id() AND
        public.is_tenant_admin(auth.uid(), tenant_id)
      )
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "super_admin_invitations_all" ON public.user_invitations IS 'Super admins can manage all invitations';
COMMENT ON POLICY "tenant_admin_invitations_all" ON public.user_invitations IS 'Tenant admins can manage invitations for their tenant';
COMMENT ON POLICY "authenticated_create_invitations" ON public.user_invitations IS 'Authenticated users can create invitations with proper permissions';
COMMENT ON POLICY "authenticated_read_invitations" ON public.user_invitations IS 'Authenticated users can read relevant invitations';
COMMENT ON POLICY "authenticated_update_invitations" ON public.user_invitations IS 'Authenticated users can update invitations they created';
COMMENT ON POLICY "authenticated_delete_invitations" ON public.user_invitations IS 'Authenticated users can delete invitations they created';
