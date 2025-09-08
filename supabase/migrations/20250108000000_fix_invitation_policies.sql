-- Fix RLS policies for user_invitations table
-- Allow super_admin users to create invitations for any tenant

-- Drop existing policies
DROP POLICY IF EXISTS "Tenant admins can view tenant invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Tenant admins can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Super admins can view all invitations" ON public.user_invitations;

-- Create new policies that allow super_admin to manage all invitations
CREATE POLICY "Super admins can manage all invitations" ON public.user_invitations
  FOR ALL TO authenticated USING (is_super_admin());

-- Allow tenant admins to view and create invitations for their own tenant
CREATE POLICY "Tenant admins can view tenant invitations" ON public.user_invitations
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

CREATE POLICY "Tenant admins can create invitations" ON public.user_invitations
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

-- Allow users to view their own invitations (for invitation acceptance)
CREATE POLICY "Users can view their own invitations" ON public.user_invitations
  FOR SELECT TO authenticated USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow system to update invitation status (when invitation is used)
CREATE POLICY "System can update invitation status" ON public.user_invitations
  FOR UPDATE TO authenticated USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR is_super_admin()
  );
