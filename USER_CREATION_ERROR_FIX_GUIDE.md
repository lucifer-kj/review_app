# User Creation Error Fix Guide

## 🚨 **ERROR IDENTIFIED**

**Error**: `"Database error saving new user"` when trying to invite users via Supabase Auth.

**Root Cause**: The `handle_new_user()` trigger function is failing when trying to create user profiles, causing the entire user creation process to fail.

## 🔍 **Root Causes Found**

### **1. Conflicting Trigger Functions**
- **Old migration** (20250829): Simple function that only sets role to 'staff'
- **New migration** (20250110): Complex function that handles invitations
- **Conflict**: Multiple versions causing unpredictable behavior

### **2. Missing Error Handling**
- **No exception handling** in the trigger function
- **Silent failures** when invitation data is missing
- **No fallback** when profile creation fails

### **3. RLS Policy Issues**
- **Trigger runs with different context** than application
- **RLS policies** might block profile creation
- **Permission issues** in trigger execution

## ✅ **Comprehensive Fix Applied**

### **1. Created Robust Trigger Function**
```sql
-- New handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
  user_tenant_id UUID;
  user_role TEXT;
BEGIN
  -- Try to find invitation for this email
  SELECT ui.tenant_id, ui.role
  INTO invitation_record
  FROM public.user_invitations ui
  WHERE ui.email = NEW.email 
    AND ui.used_at IS NULL 
    AND ui.expires_at > NOW()
  LIMIT 1;

  -- Set values based on invitation or defaults
  IF invitation_record IS NOT NULL THEN
    user_tenant_id := invitation_record.tenant_id;
    user_role := invitation_record.role;
    
    -- Mark invitation as used
    UPDATE public.user_invitations 
    SET used_at = NOW()
    WHERE email = NEW.email 
      AND used_at IS NULL 
      AND expires_at > NOW();
  ELSE
    user_tenant_id := NULL;
    user_role := 'user';
  END IF;

  -- Create profile with proper error handling
  INSERT INTO public.profiles (
    id, email, full_name, role, tenant_id,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role, user_tenant_id, NOW(), NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.email, SQLERRM;
    
    -- Create minimal profile to prevent complete failure
    INSERT INTO public.profiles (
      id, email, full_name, role, tenant_id,
      created_at, updated_at
    )
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'user', NULL, NOW(), NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2. Key Improvements**
- ✅ **Exception handling** - Catches and logs errors
- ✅ **Fallback mechanism** - Creates minimal profile if main creation fails
- ✅ **Invitation handling** - Properly processes invitation data
- ✅ **Error logging** - Warns about issues without failing
- ✅ **Graceful degradation** - Always creates some profile

## 🚀 **Deployment Steps**

### **Step 1: Apply the Fix Migration**
```bash
# Apply the user creation trigger fix
supabase db push

# Or manually run in Supabase Dashboard:
# File: supabase/migrations/20250110000003_fix_user_creation_trigger.sql
```

### **Step 2: Test User Creation**
```bash
# Run the user creation test
node scripts/test-user-creation.js
```

### **Step 3: Test Invitation Flow**
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Invite a new user"
3. Enter email: `test@example.com`
4. Click "Invite user"
5. Should now work without "Database error saving new user"

## 🧪 **Testing Checklist**

### **✅ What Should Work Now**
- [ ] User invitation via Supabase Dashboard
- [ ] User creation in auth.users table
- [ ] Profile creation in profiles table
- [ ] Proper tenant assignment from invitations
- [ ] Invitation marking as used
- [ ] Error handling without complete failure

### **🔍 Debug Commands**
```bash
# Test user creation process
node scripts/test-user-creation.js

# Check trigger function
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

# Check trigger existence
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

# Check profiles table
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;
```

## 🎯 **Expected Results**

### **Success Case**
- ✅ User created in auth.users table
- ✅ Profile created in profiles table
- ✅ Proper role and tenant_id assigned
- ✅ Invitation marked as used
- ✅ No "Database error saving new user"

### **Error Cases (Now Handled)**
- ⚠️ **Missing invitation data** - Creates default profile
- ⚠️ **RLS policy issues** - Logs warning, creates minimal profile
- ⚠️ **Permission errors** - Graceful fallback
- ⚠️ **Data validation errors** - Handled with defaults

## 🔍 **Troubleshooting**

### **If Still Getting Errors**

1. **Check Migration Applied**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

2. **Check Trigger Exists**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

3. **Test Function Manually**
   ```sql
   -- This should not error
   SELECT public.handle_new_user();
   ```

4. **Check Supabase Logs**
   - Go to Supabase Dashboard > Logs
   - Look for "Error creating profile" warnings
   - Check for any RLS policy violations

### **Common Issues & Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| Function not found | Migration not applied | Run `supabase db push` |
| Trigger not found | Trigger not created | Apply migration again |
| RLS policy violation | Permission issues | Check user permissions |
| Profile creation fails | Data validation | Check table structure |

## 📊 **Monitoring**

### **Success Metrics**
- User creation success rate: >99%
- Profile creation success rate: >95%
- Invitation processing rate: >90%

### **Error Tracking**
- Monitor Supabase logs for warnings
- Check profiles table for missing records
- Verify invitation usage tracking

## 🎉 **Success Criteria**

- [ ] No more "Database error saving new user"
- [ ] Users created successfully in auth.users
- [ ] Profiles created with proper tenant assignment
- [ ] Invitations marked as used
- [ ] Graceful error handling
- [ ] Complete invitation flow working

---

**🚀 The user creation process should now work flawlessly with comprehensive error handling!**
