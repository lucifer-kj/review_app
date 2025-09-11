-- Enhance Public Review Access with Tenant Validation
-- This migration ensures anonymous users can submit reviews with proper tenant validation
-- Date: January 18, 2025

-- ============================================================================
-- UPDATE RLS POLICIES FOR SECURE ANONYMOUS REVIEW SUBMISSION
-- ============================================================================

-- Drop existing anonymous review policies
DROP POLICY IF EXISTS "anonymous_review_insert" ON public.reviews;

-- Create secure anonymous review insert policy with tenant validation
CREATE POLICY "anonymous_review_insert_secure" ON public.reviews
  FOR INSERT TO anon WITH CHECK (
    tenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.tenants 
      WHERE id = tenant_id AND status = 'active'
    )
  );

-- ============================================================================
-- CREATE FUNCTION TO VALIDATE TENANT FOR PUBLIC REVIEWS
-- ============================================================================

-- Function to get tenant info for public review forms
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
    bs.business_name,
    bs.business_email,
    bs.business_phone,
    bs.business_address,
    bs.google_business_url,
    bs.form_customization
  FROM public.tenants t
  LEFT JOIN public.business_settings bs ON bs.tenant_id = t.id
  WHERE t.id = p_tenant_id 
    AND t.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE FUNCTION TO SUBMIT PUBLIC REVIEW
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
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION get_tenant_for_public_review(UUID) TO anon;
GRANT EXECUTE ON FUNCTION submit_public_review(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB) TO anon;

-- Ensure anonymous users can read tenants for validation
GRANT SELECT ON public.tenants TO anon;
GRANT SELECT ON public.business_settings TO anon;

-- ============================================================================
-- UPDATE EXISTING TENANT WITH REVIEW URL
-- ============================================================================

-- Update the demo tenant to include the public review URL
UPDATE public.tenants 
SET 
  settings = COALESCE(settings, '{}'::jsonb) || 
  jsonb_build_object(
    'public_review_url', '/review/' || id::text,
    'review_form_url', '/review/' || id::text
  ),
  updated_at = NOW()
WHERE id = '36dcb9ba-9dec-4cb1-9465-a084e73329c4';

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_tenant_for_public_review(UUID) IS 'Gets tenant and business info for public review forms with validation';
COMMENT ON FUNCTION submit_public_review(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB) IS 'Securely submits a review from public form with tenant validation';
COMMENT ON POLICY "anonymous_review_insert_secure" ON public.reviews IS 'Allows anonymous review inserts only for active tenants with validation';
