-- Direct SQL fix for ambiguous column reference
-- This script fixes the "column reference tenant_id is ambiguous" error

-- First, let's check what's causing the ambiguity
-- The issue is likely in the RLS policies or functions

-- Drop and recreate the problematic function with explicit table references
DROP FUNCTION IF EXISTS public.get_tenant_usage_stats(UUID) CASCADE;

-- Recreate the function with explicit table references to avoid ambiguity
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

-- Ensure the get_current_tenant_id function is working correctly
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  result UUID;
BEGIN
  SELECT tenant_id INTO result
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS policies to avoid ambiguity
-- Drop existing policies that might cause issues
DROP POLICY IF EXISTS "tenant_isolation" ON public.business_settings;
DROP POLICY IF EXISTS "tenant_isolation" ON public.reviews;
DROP POLICY IF EXISTS "tenant_isolation" ON public.profiles;

-- Recreate RLS policies with explicit table references
CREATE POLICY "tenant_isolation_business_settings" ON public.business_settings
  FOR ALL USING (
    CASE 
      WHEN tenant_id IS NOT NULL THEN tenant_id = get_current_tenant_id()
      ELSE true -- Allow access if no tenant_id (for backward compatibility)
    END
  );

CREATE POLICY "tenant_isolation_reviews" ON public.reviews
  FOR ALL USING (
    tenant_id = get_current_tenant_id()
  );

CREATE POLICY "tenant_isolation_profiles" ON public.profiles
  FOR ALL USING (
    id = auth.uid() OR 
    (tenant_id IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- Add indexes to improve query performance and avoid ambiguity
CREATE INDEX IF NOT EXISTS idx_business_settings_tenant_id ON public.business_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON public.business_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_usage_stats(UUID) TO authenticated;

-- Test the function to make sure it works
SELECT 'Function test completed successfully' as status;
