# 🗄️ Database Cleanup Deployment Guide

## Overview
This guide walks you through deploying the consolidated database schema that fixes all migration conflicts and establishes proper multi-tenancy.

## 🚨 **CRITICAL: Backup First!**
Before proceeding, **BACKUP YOUR DATABASE**:
```bash
# Using Supabase CLI
supabase db dump --file backup_$(date +%Y%m%d_%H%M%S).sql

# Or using pg_dump
pg_dump -h your-db-host -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📋 **What This Cleanup Does**

### ✅ **Consolidates 30 Migration Files**
- Removes conflicting migrations
- Creates single, clean schema
- Eliminates duplicate functions
- Fixes inconsistent RLS policies

### ✅ **Establishes Proper Multi-Tenancy**
- All tables include `tenant_id` for isolation
- Proper RLS policies for tenant separation
- Super admin bypass for platform management
- Tenant-scoped access for regular users

### ✅ **Implements Missing Functions**
- `get_platform_analytics()` - Platform-wide metrics
- `get_all_reviews_for_dashboard()` - Tenant review data
- `get_review_stats_for_dashboard()` - Review statistics
- `create_tenant_with_admin()` - Tenant creation with admin

### ✅ **Adds Performance Indexes**
- Optimized queries for tenant isolation
- Indexes on frequently queried columns
- Performance improvements for large datasets

## 🚀 **Deployment Steps**

### **Step 1: Clean Up Old Migrations**
```bash
# Run the cleanup script
node scripts/cleanup-old-migrations.js
```

This will:
- Remove 29 conflicting migration files
- Keep only the consolidated migration
- Show summary of cleanup

### **Step 2: Apply Consolidated Migration**

#### **Option A: Using Supabase CLI (Recommended)**
```bash
# Apply the consolidated migration
supabase db push

# Or apply specific migration
supabase db push --include-all
```

#### **Option B: Using Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250110000000_consolidated_database_schema.sql`
4. Click **Run**

#### **Option C: Using psql**
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250110000000_consolidated_database_schema.sql
```

### **Step 3: Verify Schema**
```bash
# Run verification script
node scripts/verify-database-schema.js
```

This will verify:
- All tables exist
- All functions work
- RLS policies are active
- Indexes are created
- System settings are populated

### **Step 4: Test Application**
1. **Start the application**
2. **Test authentication flow**
3. **Verify tenant creation**
4. **Test review submission**
5. **Check role-based access**

## 📊 **Schema Overview**

### **Core Tables**
```sql
-- Multi-tenant root
tenants (id, name, domain, status, settings, ...)

-- User management with tenant association
profiles (id, email, role, tenant_id, ...)

-- Invitation system
user_invitations (id, tenant_id, email, role, token, ...)

-- Business configuration per tenant
business_settings (id, tenant_id, user_id, business_name, ...)

-- Customer reviews with tenant isolation
reviews (id, tenant_id, customer_name, rating, ...)

-- Audit trail for compliance
audit_logs (id, tenant_id, user_id, action, ...)

-- Usage tracking and analytics
usage_metrics (id, tenant_id, metric_type, ...)

-- Global system configuration
system_settings (id, key, value, ...)
```

### **Key Functions**
```sql
-- User creation with proper tenant assignment
handle_new_user() -> Creates profile with tenant_id from invitation

-- Tenant context for RLS
get_current_tenant_id() -> Returns user's tenant_id

-- Role checking
is_super_admin(user_id) -> Boolean
is_tenant_admin(user_id, tenant_id) -> Boolean

-- Platform analytics
get_platform_analytics() -> Platform-wide metrics

-- Tenant analytics
get_all_reviews_for_dashboard(tenant_id) -> Tenant reviews
get_review_stats_for_dashboard(tenant_id) -> Review statistics

-- Tenant creation
create_tenant_with_admin(tenant_data, admin_email) -> Creates tenant + invitation
```

### **RLS Policies**
- **Super Admin**: Access to all data across all tenants
- **Tenant Admin**: Access to own tenant data + user management
- **User**: Access to own tenant data only
- **Anonymous**: Can insert reviews (for public review forms)

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Migration Conflicts**
```bash
# If you get conflicts, reset the database
supabase db reset

# Then apply the consolidated migration
supabase db push
```

#### **2. Missing Functions**
```sql
-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_platform_analytics', 'get_current_tenant_id');
```

#### **3. RLS Policy Issues**
```sql
-- Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

#### **4. Permission Errors**
```sql
-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
```

### **Rollback Plan**
If issues occur:

1. **Restore from backup**:
   ```bash
   psql -h your-db-host -U postgres -d postgres < backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Or reset database**:
   ```bash
   supabase db reset
   ```

## ✅ **Verification Checklist**

After deployment, verify:

- [ ] All 8 core tables exist
- [ ] All 9 functions work correctly
- [ ] RLS policies are active on all tables
- [ ] Indexes are created for performance
- [ ] System settings are populated
- [ ] Authentication flow works
- [ ] Tenant creation works
- [ ] Review submission works
- [ ] Role-based access works
- [ ] Multi-tenancy isolation works

## 🎯 **Expected Results**

After successful deployment:

### **Performance Improvements**
- Faster queries due to proper indexing
- Better tenant isolation
- Optimized database functions

### **Security Enhancements**
- Proper RLS policies
- Tenant data isolation
- Role-based access control

### **Functionality**
- Working invitation system
- Proper tenant creation
- Analytics functions
- Audit logging

## 📞 **Support**

If you encounter issues:

1. **Check the verification script output**
2. **Review error messages carefully**
3. **Ensure all environment variables are set**
4. **Verify Supabase connection**
5. **Check database permissions**

## 🎉 **Success Criteria**

The deployment is successful when:

- ✅ Verification script passes all checks
- ✅ Application starts without errors
- ✅ Authentication works properly
- ✅ Tenant creation works
- ✅ Review submission works
- ✅ Role-based access works
- ✅ Multi-tenancy isolation works

---

**⚠️ Important**: This is a major database restructuring. Test thoroughly in a development environment before applying to production.
