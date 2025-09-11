-- Fix tenant lookup issues for public review forms
-- This migration fixes ambiguous column references and ensures proper tenant lookup
-- Date: January 18, 2025

-- ============================================================================
-- DROP AND RECREATE FUNCTIONS WITH PROPER COLUMN QUALIFICATION
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS get_tenant_for_public_review(UUID);
DROP FUNCTION IF EXISTS submit_public_review(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB);

-- ============================================================================
-- CREATE IMPROVED TENANT LOOKUP FUNCTION
-- ============================================================================

-- Function to get tenant info for public review forms with proper column qualification
CREATE OR REPLACE FUNCTION get_tenant_for_public_review(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  status TEXT,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  google_business_url TEXT,
  form_customization JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.status,
    COALESCE(bs.business_name, t.name) as business_name,
    bs.business_email,
    bs.business_phone,
    bs.business_address,
    bs.google_business_url,
    COALESCE(bs.form_customization, '{}'::jsonb) as form_customization
  FROM public.tenants t
  LEFT JOIN public.business_settings bs ON bs.tenant_id = t.id
  WHERE t.id = p_tenant_id 
    AND t.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE IMPROVED REVIEW SUBMISSION FUNCTION
-- ============================================================================

-- Function to submit a review from public form with validation
CREATE OR REPLACE FUNCTION submit_public_review(
  p_tenant_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT '+1',
  p_rating INTEGER,
  p_review_text TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  review_id UUID,
  message TEXT
) AS $$
DECLARE
  v_tenant_exists BOOLEAN;
  v_review_id UUID;
BEGIN
  -- Validate tenant exists and is active
  SELECT EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE id = p_tenant_id AND status = 'active'
  ) INTO v_tenant_exists;
  
  IF NOT v_tenant_exists THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Invalid or inactive tenant';
    RETURN;
  END IF;
  
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Rating must be between 1 and 5';
    RETURN;
  END IF;
  
  -- Insert the review
  INSERT INTO public.reviews (
    tenant_id,
    customer_name,
    customer_email,
    customer_phone,
    country_code,
    rating,
    review_text,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    p_tenant_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_country_code,
    p_rating,
    p_review_text,
    p_metadata,
    NOW(),
    NOW()
  ) RETURNING id INTO v_review_id;
  
  -- Return success
  RETURN QUERY SELECT true, v_review_id, 'Review submitted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE DEBUG FUNCTION TO CHECK TENANT STATUS
-- ============================================================================

-- Function to debug tenant lookup issues
CREATE OR REPLACE FUNCTION debug_tenant_lookup(p_tenant_id UUID)
RETURNS TABLE (
  tenant_exists BOOLEAN,
  tenant_status TEXT,
  tenant_name TEXT,
  business_settings_exist BOOLEAN,
  business_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.tenants WHERE id = p_tenant_id) as tenant_exists,
    COALESCE(t.status, 'NOT_FOUND') as tenant_status,
    COALESCE(t.name, 'NOT_FOUND') as tenant_name,
    EXISTS(SELECT 1 FROM public.business_settings WHERE tenant_id = p_tenant_id) as business_settings_exist,
    COALESCE(bs.business_name, 'NOT_SET') as business_name
  FROM public.tenants t
  LEFT JOIN public.business_settings bs ON bs.tenant_id = t.id
  WHERE t.id = p_tenant_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_tenant_for_public_review(UUID) TO anon;
GRANT EXECUTE ON FUNCTION submit_public_review(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION debug_tenant_lookup(UUID) TO anon;

-- ============================================================================
-- CREATE TEST TENANT IF IT DOESN'T EXIST
-- ============================================================================

-- Check if the test tenant exists, if not create it
INSERT INTO public.tenants (
  id,
  name,
  domain,
  status,
  plan_type,
  settings,
  created_at,
  updated_at
) VALUES (
  '9509987d-21e5-4205-87c1-021560ba6581',
  'Test Business',
  'test.example.com',
  'active',
  'basic',
  '{"review_form_url": "http://localhost:3000/review/9509987d-21e5-4205-87c1-021560ba6581"}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create business settings for the test tenant
INSERT INTO public.business_settings (
  tenant_id,
  business_name,
  business_email,
  business_phone,
  business_address,
  google_business_url,
  form_customization,
  created_at,
  updated_at
) VALUES (
  '9509987d-21e5-4205-87c1-021560ba6581',
  'Test Business',
  'test@example.com',
  '+1-555-0123',
  '123 Test Street, Test City, TC 12345',
  'https://g.page/test-business',
  '{
    "primary_color": "#3b82f6",
    "secondary_color": "#1e40af",
    "welcome_message": "Share your experience with Test Business",
    "thank_you_message": "Thank you for your feedback!",
    "required_fields": ["customer_name", "rating"],
    "optional_fields": ["customer_email", "customer_phone", "review_text"]
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (tenant_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_email = EXCLUDED.business_email,
  business_phone = EXCLUDED.business_phone,
  business_address = EXCLUDED.business_address,
  google_business_url = EXCLUDED.google_business_url,
  form_customization = EXCLUDED.form_customization,
  updated_at = NOW();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_tenant_for_public_review(UUID) IS 'Gets tenant and business info for public review forms with proper column qualification';
COMMENT ON FUNCTION submit_public_review(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB) IS 'Securely submits a review from public form with validation';
COMMENT ON FUNCTION debug_tenant_lookup(UUID) IS 'Debug function to check tenant status and business settings';
