-- Enhanced RLS Policies for Tenant Isolation
-- This script ensures proper tenant isolation across all tables

-- Step 1: Update profiles table policies for complete tenant isolation
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Tenant admins can view tenant profiles
DROP POLICY IF EXISTS "Tenant admins can view tenant profiles" ON public.profiles;
CREATE POLICY "Tenant admins can view tenant profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

-- Super admins can view all profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR ALL TO authenticated USING (is_super_admin());

-- Step 2: Enhanced business_settings policies
DROP POLICY IF EXISTS "Users can view their own business settings" ON public.business_settings;
CREATE POLICY "Users can view their own business settings" ON public.business_settings
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can insert their own business settings" ON public.business_settings;
CREATE POLICY "Users can insert their own business settings" ON public.business_settings
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can update their own business settings" ON public.business_settings;
CREATE POLICY "Users can update their own business settings" ON public.business_settings
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can delete their own business settings" ON public.business_settings;
CREATE POLICY "Users can delete their own business settings" ON public.business_settings
  FOR DELETE TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

-- Tenant admins can view all tenant business settings
DROP POLICY IF EXISTS "Tenant admins can view tenant business settings" ON public.business_settings;
CREATE POLICY "Tenant admins can view tenant business settings" ON public.business_settings
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

-- Step 3: Enhanced reviews policies
DROP POLICY IF EXISTS "Users can view their tenant reviews" ON public.reviews;
CREATE POLICY "Users can view their tenant reviews" ON public.reviews
  FOR SELECT TO authenticated USING (
    (tenant_id = get_current_tenant_id() AND is_tenant_admin()) OR tenant_id IS NULL
  );

DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
CREATE POLICY "Users can insert reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = get_current_tenant_id() OR tenant_id IS NULL
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

-- Step 4: Enhanced user_invitations policies
DROP POLICY IF EXISTS "Tenant admins can view tenant invitations" ON public.user_invitations;
CREATE POLICY "Tenant admins can view tenant invitations" ON public.user_invitations
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Tenant admins can create invitations" ON public.user_invitations;
CREATE POLICY "Tenant admins can create invitations" ON public.user_invitations
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Tenant admins can update tenant invitations" ON public.user_invitations;
CREATE POLICY "Tenant admins can update tenant invitations" ON public.user_invitations
  FOR UPDATE TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Tenant admins can delete tenant invitations" ON public.user_invitations;
CREATE POLICY "Tenant admins can delete tenant invitations" ON public.user_invitations
  FOR DELETE TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Super admins can view all invitations" ON public.user_invitations;
CREATE POLICY "Super admins can view all invitations" ON public.user_invitations
  FOR ALL TO authenticated USING (is_super_admin());

-- Step 5: Enhanced audit_logs policies
DROP POLICY IF EXISTS "Users can view their tenant audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their tenant audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
  FOR ALL TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Step 6: Enhanced usage_metrics policies
DROP POLICY IF EXISTS "Tenant admins can view tenant metrics" ON public.usage_metrics;
CREATE POLICY "Tenant admins can view tenant metrics" ON public.usage_metrics
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Super admins can view all metrics" ON public.usage_metrics;
CREATE POLICY "Super admins can view all metrics" ON public.usage_metrics
  FOR ALL TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "System can insert metrics" ON public.usage_metrics;
CREATE POLICY "System can insert metrics" ON public.usage_metrics
  FOR INSERT WITH CHECK (true);

-- Step 7: Enhanced tenants policies
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
CREATE POLICY "Super admins can view all tenants" ON public.tenants
  FOR SELECT TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can create tenants" ON public.tenants;
CREATE POLICY "Super admins can create tenants" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
CREATE POLICY "Super admins can update tenants" ON public.tenants
  FOR UPDATE TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete tenants" ON public.tenants;
CREATE POLICY "Super admins can delete tenants" ON public.tenants
  FOR DELETE TO authenticated USING (is_super_admin());

-- Step 8: Enhanced system_settings policies
DROP POLICY IF EXISTS "Super admins can manage system settings" ON public.system_settings;
CREATE POLICY "Super admins can manage system settings" ON public.system_settings
  FOR ALL TO authenticated USING (is_super_admin());

-- Step 9: Create function to check if user has access to resource
CREATE OR REPLACE FUNCTION public.user_has_resource_access(
  resource_tenant_id UUID,
  required_role TEXT DEFAULT 'user'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins have access to everything
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check if user has access to the resource's tenant
  IF resource_tenant_id IS NULL THEN
    -- Allow access to resources without tenant (backward compatibility)
    RETURN TRUE;
  END IF;

  -- Check if user belongs to the same tenant
  IF get_current_tenant_id() = resource_tenant_id THEN
    -- Check role requirements
    IF required_role = 'admin' THEN
      RETURN is_tenant_admin();
    ELSE
      RETURN TRUE; -- Regular users can access their tenant's resources
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.user_has_resource_access(uuid, text) TO anon, authenticated;

-- Step 11: Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id_role ON public.profiles(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_business_settings_tenant_user ON public.business_settings(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_user ON public.reviews(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant_email ON public.user_invitations(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_user ON public.audit_logs(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_type ON public.usage_metrics(tenant_id, metric_type);

-- Step 12: Add comments for documentation
COMMENT ON FUNCTION public.user_has_resource_access(uuid, text) IS 
'Checks if the current user has access to a resource based on tenant isolation and role requirements';

COMMENT ON FUNCTION public.get_current_tenant_id() IS 
'Returns the tenant ID of the current authenticated user';

COMMENT ON FUNCTION public.is_super_admin(uuid) IS 
'Checks if the specified user (or current user) has super admin role';

COMMENT ON FUNCTION public.is_tenant_admin(uuid, uuid) IS 
'Checks if the specified user (or current user) has tenant admin role for the specified tenant';
