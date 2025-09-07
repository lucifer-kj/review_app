-- Enhanced Platform Analytics Function
-- This function provides comprehensive platform-wide analytics for the master dashboard

CREATE OR REPLACE FUNCTION get_platform_analytics()
RETURNS TABLE (
  total_tenants BIGINT,
  active_tenants BIGINT,
  suspended_tenants BIGINT,
  total_users BIGINT,
  active_users BIGINT,
  total_reviews BIGINT,
  reviews_this_month BIGINT,
  reviews_last_month BIGINT,
  average_rating NUMERIC,
  total_revenue NUMERIC,
  revenue_this_month NUMERIC,
  revenue_growth_rate NUMERIC,
  review_growth_rate NUMERIC,
  user_growth_rate NUMERIC,
  tenant_growth_rate NUMERIC,
  system_health_score NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  current_month_start DATE := date_trunc('month', CURRENT_DATE);
  last_month_start DATE := date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
  last_month_end DATE := current_month_start - INTERVAL '1 day';
  two_months_ago_start DATE := date_trunc('month', CURRENT_DATE - INTERVAL '2 months');
  two_months_ago_end DATE := last_month_start - INTERVAL '1 day';
BEGIN
  RETURN QUERY
  WITH tenant_stats AS (
    SELECT 
      COUNT(*) as total_tenants,
      COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
      COUNT(*) FILTER (WHERE status = 'suspended') as suspended_tenants,
      COUNT(*) FILTER (WHERE created_at >= current_month_start) as tenants_this_month,
      COUNT(*) FILTER (WHERE created_at >= last_month_start AND created_at < current_month_start) as tenants_last_month,
      COUNT(*) FILTER (WHERE created_at >= two_months_ago_start AND created_at < last_month_start) as tenants_two_months_ago
    FROM tenants
  ),
  user_stats AS (
    SELECT 
      COUNT(DISTINCT p.id) as total_users,
      COUNT(DISTINCT p.id) FILTER (WHERE p.created_at >= current_month_start) as users_this_month,
      COUNT(DISTINCT p.id) FILTER (WHERE p.created_at >= last_month_start AND p.created_at < current_month_start) as users_last_month,
      COUNT(DISTINCT p.id) FILTER (WHERE p.created_at >= two_months_ago_start AND p.created_at < last_month_start) as users_two_months_ago
    FROM profiles p
    WHERE p.tenant_id IS NOT NULL
  ),
  review_stats AS (
    SELECT 
      COUNT(*) as total_reviews,
      COUNT(*) FILTER (WHERE created_at >= current_month_start) as reviews_this_month,
      COUNT(*) FILTER (WHERE created_at >= last_month_start AND created_at < current_month_start) as reviews_last_month,
      COUNT(*) FILTER (WHERE created_at >= two_months_ago_start AND created_at < last_month_start) as reviews_two_months_ago,
      AVG(rating) as average_rating
    FROM reviews
  ),
  revenue_stats AS (
    SELECT 
      COALESCE(SUM(metric_value), 0) as total_revenue,
      COALESCE(SUM(metric_value) FILTER (WHERE recorded_at >= current_month_start), 0) as revenue_this_month,
      COALESCE(SUM(metric_value) FILTER (WHERE recorded_at >= last_month_start AND recorded_at < current_month_start), 0) as revenue_last_month
    FROM usage_metrics
    WHERE metric_type = 'revenue'
  ),
  growth_calculations AS (
    SELECT 
      -- Tenant growth rate
      CASE 
        WHEN ts.tenants_last_month > 0 THEN 
          ROUND(((ts.tenants_this_month::NUMERIC - ts.tenants_last_month::NUMERIC) / ts.tenants_last_month::NUMERIC) * 100, 2)
        ELSE 0 
      END as tenant_growth_rate,
      
      -- User growth rate
      CASE 
        WHEN us.users_last_month > 0 THEN 
          ROUND(((us.users_this_month::NUMERIC - us.users_last_month::NUMERIC) / us.users_last_month::NUMERIC) * 100, 2)
        ELSE 0 
      END as user_growth_rate,
      
      -- Review growth rate
      CASE 
        WHEN rs.reviews_last_month > 0 THEN 
          ROUND(((rs.reviews_this_month::NUMERIC - rs.reviews_last_month::NUMERIC) / rs.reviews_last_month::NUMERIC) * 100, 2)
        ELSE 0 
      END as review_growth_rate,
      
      -- Revenue growth rate
      CASE 
        WHEN revs.revenue_last_month > 0 THEN 
          ROUND(((revs.revenue_this_month - revs.revenue_last_month) / revs.revenue_last_month) * 100, 2)
        ELSE 0 
      END as revenue_growth_rate
    FROM tenant_stats ts, user_stats us, review_stats rs, revenue_stats revs
  ),
  system_health AS (
    SELECT 
      CASE 
        WHEN ts.active_tenants::NUMERIC / NULLIF(ts.total_tenants, 0) >= 0.95 THEN 100
        WHEN ts.active_tenants::NUMERIC / NULLIF(ts.total_tenants, 0) >= 0.90 THEN 90
        WHEN ts.active_tenants::NUMERIC / NULLIF(ts.total_tenants, 0) >= 0.80 THEN 80
        WHEN ts.active_tenants::NUMERIC / NULLIF(ts.total_tenants, 0) >= 0.70 THEN 70
        ELSE 60
      END as health_score
    FROM tenant_stats ts
  )
  SELECT 
    ts.total_tenants,
    ts.active_tenants,
    ts.suspended_tenants,
    us.total_users,
    us.total_users as active_users, -- Assuming all users in profiles are active
    rs.total_reviews,
    rs.reviews_this_month,
    rs.reviews_last_month,
    ROUND(COALESCE(rs.average_rating, 0), 2),
    revs.total_revenue,
    revs.revenue_this_month,
    gc.revenue_growth_rate,
    gc.review_growth_rate,
    gc.user_growth_rate,
    gc.tenant_growth_rate,
    sh.health_score,
    NOW() as last_updated
  FROM tenant_stats ts
  CROSS JOIN user_stats us
  CROSS JOIN review_stats rs
  CROSS JOIN revenue_stats revs
  CROSS JOIN growth_calculations gc
  CROSS JOIN system_health sh;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_platform_analytics() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_platform_analytics() IS 'Returns comprehensive platform analytics including tenant, user, review, and revenue metrics with growth rates';
