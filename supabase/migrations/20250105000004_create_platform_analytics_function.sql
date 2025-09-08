-- Create Platform Analytics Function
-- This function provides real-time analytics for the super admin dashboard

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS get_platform_analytics();

-- Create new function with updated signature
CREATE FUNCTION get_platform_analytics()
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
    -- Total tenants count
    COUNT(DISTINCT t.id) as total_tenants,

    -- Active tenants count (status = 'active')
    COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,

    -- Total users across all tenants
    COUNT(DISTINCT p.id) as total_users,

    -- Total reviews across all tenants
    COUNT(DISTINCT r.id) as total_reviews,

    -- Reviews this month
    COUNT(DISTINCT CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_this_month,

    -- Reviews last month
    COUNT(DISTINCT CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      AND r.created_at < date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_last_month,

    -- Average rating across all reviews
    COALESCE(AVG(r.rating), 0) as average_rating

  FROM tenants t
  LEFT JOIN profiles p ON p.tenant_id = t.id
  LEFT JOIN reviews r ON r.tenant_id = t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_platform_analytics() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_platform_analytics() IS 'Returns comprehensive platform analytics for super admin dashboard';
