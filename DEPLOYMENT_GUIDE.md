# Database Migration Deployment Guide

## Overview
This guide will help you deploy the multi-tenancy migration to your Supabase database safely without breaking existing data.

## Prerequisites
- Supabase project with existing data
- Supabase service role key
- Node.js installed
- Access to your Supabase project

## Step 1: Set Environment Variables

Create a `.env` file in your project root or set environment variables:

```bash
# Required environment variables
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

**To get your service role key:**
1. Go to your Supabase Dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (not the anon key)

## Step 2: Install Dependencies

Make sure you have the required Node.js packages:

```bash
npm install @supabase/supabase-js
```

## Step 3: Deploy the Migration

Run the migration script:

```bash
node scripts/deploy-migration.js
```

This script will:
- ✅ Create all multi-tenancy tables (`tenants`, `user_invitations`, `audit_logs`, etc.)
- ✅ Add `tenant_id` columns to existing tables
- ✅ Create all necessary database functions
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create indexes for performance
- ✅ Create a default tenant for existing data
- ✅ Verify the migration was successful

## Step 4: Create Your First Super Admin

After the migration is complete, promote a user to super admin:

```bash
node scripts/promote-user.js admin@yourdomain.com
```

Replace `admin@yourdomain.com` with the email of the user you want to promote.

## Step 5: Verify the Migration

### Check Tables
Verify that all new tables were created:
- `tenants`
- `user_invitations`
- `audit_logs`
- `usage_metrics`
- `system_settings`

### Check Functions
Verify that all functions were created:
- `get_current_tenant_id()`
- `is_super_admin()`
- `is_tenant_admin()`
- `get_all_reviews_for_dashboard()`
- `get_review_stats_for_dashboard()`
- `get_platform_analytics()`

### Check Data
Verify that existing data was preserved:
- All existing reviews should have a `tenant_id`
- All existing profiles should have a `tenant_id`
- All existing business_settings should have a `tenant_id`

## Step 6: Test the Application

1. **Login Test**: Try logging in with your promoted super admin user
2. **Master Dashboard**: Verify you can access `/master` route
3. **Tenant Management**: Test creating a new tenant
4. **User Invitations**: Test the invitation system
5. **Review System**: Verify reviews still work correctly

## Troubleshooting

### Common Issues

#### 1. "Cannot apply migration in read-only mode"
**Solution**: The Supabase MCP is in read-only mode. Use the manual deployment script instead.

#### 2. "Permission denied" errors
**Solution**: Make sure you're using the service role key, not the anon key.

#### 3. "Table already exists" errors
**Solution**: This is normal for some tables. The script handles this gracefully.

#### 4. "Function already exists" errors
**Solution**: This is normal for some functions. The script handles this gracefully.

### Manual Verification

If you need to verify the migration manually, you can run these SQL queries in your Supabase SQL editor:

```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings');

-- Check if tenant_id columns were added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'tenant_id';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_tenant_id', 'is_super_admin', 'is_tenant_admin');

-- Check default tenant
SELECT * FROM tenants WHERE name = 'Default Tenant';
```

## Rollback Plan

If you need to rollback the migration:

1. **Backup your data** (always do this first)
2. **Drop new tables**:
   ```sql
   DROP TABLE IF EXISTS system_settings CASCADE;
   DROP TABLE IF EXISTS usage_metrics CASCADE;
   DROP TABLE IF EXISTS audit_logs CASCADE;
   DROP TABLE IF EXISTS user_invitations CASCADE;
   DROP TABLE IF EXISTS tenants CASCADE;
   ```

3. **Remove tenant_id columns**:
   ```sql
   ALTER TABLE profiles DROP COLUMN IF EXISTS tenant_id;
   ALTER TABLE business_settings DROP COLUMN IF EXISTS tenant_id;
   ALTER TABLE reviews DROP COLUMN IF EXISTS tenant_id;
   ```

4. **Drop functions**:
   ```sql
   DROP FUNCTION IF EXISTS get_current_tenant_id();
   DROP FUNCTION IF EXISTS is_super_admin(uuid);
   DROP FUNCTION IF EXISTS is_tenant_admin(uuid, uuid);
   DROP FUNCTION IF EXISTS get_all_reviews_for_dashboard(uuid);
   DROP FUNCTION IF EXISTS get_review_stats_for_dashboard(uuid);
   DROP FUNCTION IF EXISTS get_platform_analytics();
   ```

## Post-Migration Tasks

After successful migration:

1. **Update Environment Variables**: Add any new environment variables needed
2. **Test All Features**: Thoroughly test all application features
3. **Create Tenants**: Set up your first real tenants
4. **Invite Users**: Test the invitation system
5. **Monitor Performance**: Watch for any performance issues
6. **Backup Database**: Create a backup of your migrated database

## Support

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify all environment variables are set correctly
3. Ensure you're using the service role key
4. Check that the migration script completed without errors
5. Review the troubleshooting section above

## Next Steps

Once the migration is complete:

1. **Phase 2**: Begin implementing Phase 2 features from Focus.md
2. **User Management**: Complete the user management interface
3. **Audit Logging**: Implement comprehensive audit logging
4. **Performance**: Optimize database queries and add caching
5. **Security**: Conduct security audit and penetration testing

---

**Important**: Always backup your database before running any migration!
