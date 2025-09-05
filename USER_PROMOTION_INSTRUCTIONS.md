# User Promotion Instructions

## Problem
User `edd7c8bc-f167-43b0-8ef0-53120b5cd444` is getting "Access Denied" because:
1. Database schema only supports `'admin'` and `'staff'` roles
2. Application code expects `'super_admin'` and `'tenant_admin'` roles
3. User profile doesn't exist or has wrong role

## Solution Options

### Option 1: Deploy Database Migration (Recommended)
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and run the migration: `supabase/migrations/20250105000000_update_roles_and_promote_user.sql`
3. This will:
   - Update the role system to support `super_admin`, `tenant_admin`, `user`
   - Promote the specific user to `super_admin`
   - Update all RLS policies

### Option 2: Run Promotion Script
1. Add to your `.env` file:
   ```
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
2. Run the promotion script:
   ```bash
   node scripts/promote-user.js
   ```

### Option 3: Manual SQL (Quick Fix)
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and run: `scripts/promote-user-to-super-admin.sql`

### Option 4: Test User Access
After promotion, verify it worked:
```bash
node scripts/test-user-access.js
```

## Expected Result
- User `edd7c8bc-f167-43b0-8ef0-53120b5cd444` will have `super_admin` role
- They can access the master dashboard at `/master`
- No more "Access Denied" errors

## Verification
After running any of the above options:
1. Try logging in with the user's credentials
2. Should redirect to `/master` (master dashboard)
3. Should see "Welcome, Super Admin!" toast message
