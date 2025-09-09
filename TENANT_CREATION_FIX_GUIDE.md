# Tenant Creation Fix Guide

## 🚨 Problem Identified

The tenant creation is failing because the `tenants` table in the database is missing required columns that the `TenantService.createTenant` method expects.

### **Missing Columns**:
1. `plan_type` - Required for tenant subscription plans
2. `billing_email` - Optional billing email for tenants
3. `cancelled` status - Missing from status check constraint

### **Error Details**:
```
Could not find the 'plan_type' column of 'tenants' in the schema cache
```

## 🔧 Solution

### **Step 1: Manual Database Fix (Required)**

**Go to your Supabase Dashboard** → **SQL Editor** and run this SQL:

```sql
-- MANUAL DATABASE FIX FOR MISSING COLUMNS IN TENANTS TABLE

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
```

### **Step 2: Verify the Fix**

After running the SQL, verify the fix by running this query in the SQL Editor:

```sql
-- Verify the fix by checking table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Expected Result**: You should see `plan_type` and `billing_email` columns in the results.

### **Step 3: Test Tenant Creation**

1. **Refresh your application** in the browser
2. **Go to Master Dashboard** → **Tenants** → **Create New Tenant**
3. **Fill out the form**:
   - Organization Name: "Test Company"
   - Domain: "test.com" (optional)
   - Plan Type: "Pro"
   - Description: "Test tenant"
4. **Click "Create Workspace"**

**Expected Result**: The tenant should be created successfully without errors.

## 🎯 What This Fix Does

### **Database Schema Updates**:
- ✅ Adds `plan_type` column with proper constraints
- ✅ Adds `billing_email` column for tenant billing
- ✅ Updates status constraint to include 'cancelled'
- ✅ Sets proper defaults for existing data

### **Service Compatibility**:
- ✅ `TenantService.createTenant()` will now work properly
- ✅ All tenant fields are properly mapped
- ✅ No more "column not found" errors

### **UI Functionality**:
- ✅ Tenant creation form will work
- ✅ Plan type selection will be saved
- ✅ Billing email will be stored (if provided)
- ✅ Success messages will display correctly

## 🔍 Root Cause Analysis

### **Why This Happened**:
1. **Migration Mismatch**: The consolidated migration file was missing some columns
2. **Service Evolution**: The TenantService was updated to expect more fields
3. **Schema Drift**: Database schema didn't match the service expectations

### **Prevention**:
- Always run migrations after schema changes
- Keep service interfaces in sync with database schema
- Test tenant creation after any schema updates

## ✅ After the Fix

Once you've applied the database fix:

1. **Tenant Creation** will work properly
2. **Magic Link Invitations** will work (from previous cleanup)
3. **Master Dashboard** will be fully functional
4. **User Management** will work correctly

## 🚀 Next Steps

After fixing the database:

1. **Test the complete flow**:
   - Create a tenant
   - Invite a user to the tenant
   - Verify the user receives the magic link email
   - Test the user can access their dashboard

2. **Configure Supabase** (if not done already):
   - Add redirect URLs for magic links
   - Update email templates to use `{{ .RedirectTo }}`

3. **Production Readiness**:
   - Test all master dashboard features
   - Verify multi-tenancy is working correctly
   - Test user invitation and onboarding flow

The system should now be fully functional for tenant creation and user management!
