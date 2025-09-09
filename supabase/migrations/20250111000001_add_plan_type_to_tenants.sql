-- Add plan_type column to tenants table
-- This fixes the missing plan_type column that TenantService.createTenant expects

-- Add plan_type column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'enterprise'));

-- Update existing tenants to have basic plan if they don't have one
UPDATE public.tenants 
SET plan_type = 'basic' 
WHERE plan_type IS NULL;

-- Make plan_type NOT NULL after setting defaults
ALTER TABLE public.tenants 
ALTER COLUMN plan_type SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.tenants.plan_type IS 'Subscription plan type for the tenant organization';
