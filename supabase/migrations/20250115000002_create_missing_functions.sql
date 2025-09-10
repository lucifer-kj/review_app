-- Create Missing Database Functions
-- This migration ensures all required functions exist and work correctly

-- Function to get current user's tenant ID
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin' 
    FROM public.profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID DEFAULT auth.uid(), tenant_id UUID DEFAULT public.get_current_tenant_id())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'tenant_admin' 
    FROM public.profiles 
    WHERE id = user_id 
    AND profiles.tenant_id = tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform analytics
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS TABLE (
  total_tenants BIGINT,
  active_tenants BIGINT,
  total_users BIGINT,
  total_reviews BIGINT,
  reviews_this_month BIGINT,
  reviews_last_month BIGINT,
  average_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT t.id) as total_tenants,
    COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT r.id) as total_reviews,
    COUNT(DISTINCT CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_this_month,
    COUNT(DISTINCT CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      AND r.created_at < date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_last_month,
    COALESCE(AVG(r.rating), 0) as average_rating
  FROM public.tenants t
  LEFT JOIN public.profiles p ON p.tenant_id = t.id
  LEFT JOIN public.reviews r ON r.tenant_id = t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all reviews for dashboard
CREATE OR REPLACE FUNCTION public.get_all_reviews_for_dashboard(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  rating INTEGER,
  review_text TEXT,
  google_review BOOLEAN,
  redirect_opened BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, 
    r.customer_name, 
    r.customer_email,
    r.customer_phone,
    r.rating, 
    r.review_text, 
    r.google_review,
    r.redirect_opened,
    r.created_at,
    r.metadata,
    r.user_id
  FROM public.reviews r
  WHERE r.tenant_id = p_tenant_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get review stats for dashboard
CREATE OR REPLACE FUNCTION public.get_review_stats_for_dashboard(p_tenant_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  high_rating_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(r.id) as total_reviews,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(CASE WHEN r.rating >= 4 THEN r.id END) as high_rating_reviews
  FROM public.reviews r
  WHERE r.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant usage statistics
CREATE OR REPLACE FUNCTION public.get_tenant_usage_stats(p_tenant_id UUID)
RETURNS TABLE (
  reviews_count BIGINT,
  users_count BIGINT,
  storage_used BIGINT,
  api_calls_count BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(r.id) as reviews_count,
    COUNT(DISTINCT p.id) as users_count,
    pg_total_relation_size('reviews') as storage_used,
    COUNT(al.id) as api_calls_count,
    MAX(r.created_at) as last_activity
  FROM public.tenants t
  LEFT JOIN public.reviews r ON r.tenant_id = t.id
  LEFT JOIN public.profiles p ON p.tenant_id = t.id
  LEFT JOIN public.audit_logs al ON al.tenant_id = t.id
  WHERE t.id = p_tenant_id
  GROUP BY t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create tenant with admin (for super admin use)
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(tenant_data JSON, admin_email TEXT)
RETURNS TABLE (
  tenant_id UUID,
  admin_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  new_tenant_id UUID;
  new_admin_id UUID;
  tenant_name TEXT;
  tenant_domain TEXT;
BEGIN
  -- Extract tenant data
  tenant_name := tenant_data->>'name';
  tenant_domain := tenant_data->>'domain';
  
  -- Check if user is super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Unauthorized: Super admin access required';
    RETURN;
  END IF;
  
  -- Create tenant
  INSERT INTO public.tenants (name, domain, status, settings, created_by)
  VALUES (tenant_name, tenant_domain, 'active', '{}', auth.uid())
  RETURNING id INTO new_tenant_id;
  
  -- Create admin user (this would typically be done via Supabase Auth)
  -- For now, we'll return the tenant ID and indicate admin creation needs to be done separately
  RETURN QUERY SELECT new_tenant_id, NULL::UUID, TRUE, 'Tenant created successfully. Admin user creation requires separate process.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to audit log insert
CREATE OR REPLACE FUNCTION public.audit_log_insert(action TEXT, details JSONB DEFAULT '{}')
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  current_tenant_id UUID;
BEGIN
  -- Get current tenant ID
  current_tenant_id := public.get_current_tenant_id();
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    action,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    current_tenant_id,
    auth.uid(),
    action,
    details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    NOW()
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity log
CREATE OR REPLACE FUNCTION public.get_user_activity_log(user_id UUID)
RETURNS TABLE (
  id UUID,
  action TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.details,
    al.created_at
  FROM public.audit_logs al
  WHERE al.user_id = user_id
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_reviews_for_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_review_stats_for_dashboard(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_usage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_with_admin(JSON, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_log_insert(TEXT, JSONB) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_activity_log(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'Returns current user tenant ID for RLS policies';
COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Checks if user has super admin role';
COMMENT ON FUNCTION public.is_tenant_admin(UUID, UUID) IS 'Checks if user is admin of specific tenant';
COMMENT ON FUNCTION public.get_platform_analytics() IS 'Returns platform-wide analytics for super admin';
COMMENT ON FUNCTION public.get_all_reviews_for_dashboard(UUID) IS 'Returns all reviews for tenant dashboard';
COMMENT ON FUNCTION public.get_review_stats_for_dashboard(UUID) IS 'Returns review statistics for tenant dashboard';
COMMENT ON FUNCTION public.get_tenant_usage_stats(UUID) IS 'Returns usage statistics for specific tenant';
COMMENT ON FUNCTION public.create_tenant_with_admin(JSON, TEXT) IS 'Creates tenant with admin user (super admin only)';
COMMENT ON FUNCTION public.audit_log_insert(TEXT, JSONB) IS 'Inserts audit log entry';
COMMENT ON FUNCTION public.get_user_activity_log(UUID) IS 'Returns user activity log';
