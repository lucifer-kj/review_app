-- Fix ambiguous column references in database functions
-- This migration addresses the "column reference 'tenant_id' is ambiguous" errors

-- Drop and recreate get_current_tenant_id function with explicit column references
DROP FUNCTION IF EXISTS get_current_tenant_id();

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  tenant_id UUID;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get tenant_id from profiles table with explicit table reference
  SELECT p.tenant_id INTO tenant_id
  FROM profiles p
  WHERE p.id = user_id;
  
  RETURN tenant_id;
END;
$$;

-- Drop and recreate get_all_reviews_for_dashboard function with explicit column references
DROP FUNCTION IF EXISTS get_all_reviews_for_dashboard(UUID);

CREATE OR REPLACE FUNCTION get_all_reviews_for_dashboard(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  customer_name VARCHAR,
  rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.customer_name, r.rating, r.review_text, r.created_at
  FROM reviews r
  WHERE r.tenant_id = p_tenant_id
  ORDER BY r.created_at DESC;
END;
$$;

-- Drop and recreate get_review_stats_for_dashboard function with explicit column references
DROP FUNCTION IF EXISTS get_review_stats_for_dashboard(UUID);

CREATE OR REPLACE FUNCTION get_review_stats_for_dashboard(p_tenant_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  five_star_reviews BIGINT,
  four_star_reviews BIGINT,
  three_star_reviews BIGINT,
  two_star_reviews BIGINT,
  one_star_reviews BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(r.id) as total_reviews,
    ROUND(AVG(r.rating), 2) as average_rating,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star_reviews,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star_reviews,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star_reviews,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star_reviews,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star_reviews
  FROM reviews r
  WHERE r.tenant_id = p_tenant_id;
END;
$$;

-- Update RLS policies to use explicit column references
DROP POLICY IF EXISTS "tenant_isolation" ON business_settings;
CREATE POLICY "tenant_isolation" ON business_settings
  FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation" ON reviews;
CREATE POLICY "tenant_isolation" ON reviews
  FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation" ON profiles;
CREATE POLICY "tenant_isolation" ON profiles
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_reviews_for_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_stats_for_dashboard(UUID) TO authenticated;
