-- MANUAL DATABASE FIX FOR MISSING COLUMNS IN TENANTS TABLE
-- Run this SQL in your Supabase Dashboard → SQL Editor

-- Step 1: Add missing columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'enterprise'));

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS billing_email TEXT;

-- Step 2: Update the status check constraint to include 'cancelled'
ALTER TABLE public.tenants 
DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE public.tenants 
ADD CONSTRAINT tenants_status_check 
CHECK (status IN ('active', 'suspended', 'pending', 'cancelled'));

-- Step 3: Update existing tenants to have basic plan if they don't have one
UPDATE public.tenants 
SET plan_type = 'basic' 
WHERE plan_type IS NULL;

-- Step 4: Make plan_type NOT NULL after setting defaults
ALTER TABLE public.tenants 
ALTER COLUMN plan_type SET NOT NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.tenants.plan_type IS 'Subscription plan type for the tenant organization';
COMMENT ON COLUMN public.tenants.billing_email IS 'Billing email address for the tenant organization';

-- Step 6: Verify the fix by checking table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Test tenant creation (optional)
-- INSERT INTO public.tenants (name, plan_type, billing_email, settings) 
-- VALUES ('Test Tenant', 'pro', 'billing@test.com', '{"test": true}');