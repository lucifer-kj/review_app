# Review Form Setup Guide

## Issue Description
The review form at `/review` page is unable to submit forms due to database configuration issues with anonymous user submissions.

## Root Cause
The main issues are:
1. **RLS Policies**: The database policies don't properly allow anonymous users to insert reviews
2. **Environment Variables**: Supabase configuration might not be properly set up
3. **Database Schema**: The trigger function needs to handle anonymous users correctly

## Solution Steps

### 1. Environment Setup
First, ensure your Supabase environment variables are properly configured:

1. Create a `.env` file in your project root (if it doesn't exist):
```bash
# Copy from env.example
cp env.example .env
```

2. Update the `.env` file with your actual Supabase credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Frontend Configuration
VITE_FRONTEND_URL=http://localhost:5173

# Security Configuration
VITE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com
```

3. Get your Supabase credentials:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "Project URL" and "anon public" key

### 2. Database Migration
Run the database migration to fix the RLS policies:

1. **Option A: Using Supabase CLI** (Recommended)
```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-id

# Run the migration
supabase db push
```

2. **Option B: Using Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `scripts/setup-review-form.sql`
   - Execute the script

### 3. Verify Configuration
After running the migration, test the setup:

1. **Test the review form**:
   - Go to `http://localhost:5173/review`
   - Fill out the form and submit
   - Check if the submission is successful

2. **Check the database**:
   - Go to your Supabase dashboard
   - Navigate to Table Editor > reviews
   - Verify that new reviews are being inserted

### 4. Troubleshooting

#### If you still get submission errors:

1. **Check browser console** for specific error messages
2. **Verify Supabase connection**:
   ```javascript
   // In browser console, test:
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...');
   ```

3. **Test database connection**:
   ```javascript
   // In browser console:
   import { supabasePublic } from '@/integrations/supabase/client';
   
   // Test insert
   const { data, error } = await supabasePublic
     .from('reviews')
     .insert({
       name: 'Test User',
       phone: '1234567890',
       rating: 5,
       google_review: true,
       redirect_opened: false,
       metadata: { test: true }
     })
     .select();
   
   console.log('Test result:', { data, error });
   ```

#### Common Error Messages and Solutions:

1. **"column 'user_id' does not exist"**
   - Run the database migration to ensure the schema is up to date

2. **"row-level security policy" or "RLS" errors**
   - The RLS policies need to be updated (run the migration)

3. **"network" or "fetch" errors**
   - Check your internet connection
   - Verify the Supabase URL is correct

4. **"unauthorized" or "forbidden" errors**
   - Check that your Supabase anon key is correct
   - Ensure the RLS policies allow anonymous inserts

### 5. Alternative Quick Fix
If you need a quick temporary fix while setting up the database:

1. **Disable RLS temporarily** (NOT recommended for production):
```sql
-- Only for development/testing
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
```

2. **Re-enable RLS after testing**:
```sql
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
```

### 6. Production Considerations

1. **Security**: Ensure RLS policies are properly configured for production
2. **Rate Limiting**: Consider implementing rate limiting for review submissions
3. **Validation**: Add server-side validation for review data
4. **Monitoring**: Set up monitoring for review submissions

## Files Modified

The following files were updated to fix the issue:

1. **`supabase/migrations/20250103000001_fix_anonymous_review_inserts.sql`** - New migration for RLS policies
2. **`scripts/setup-review-form.sql`** - Complete setup script
3. **`supabase/migrations/20250103000000_recreate_database_schema.sql`** - Updated trigger function

## Testing the Fix

After completing the setup:

1. **Submit a test review** through the `/review` page
2. **Check the dashboard** to see if the review appears
3. **Verify the redirect** works for high ratings (4-5 stars)
4. **Test the feedback flow** for low ratings (1-3 stars)

## Support

If you continue to experience issues:

1. Check the browser console for error messages
2. Verify your Supabase project is active and properly configured
3. Ensure all environment variables are set correctly
4. Run the database migration script
5. Test with the provided troubleshooting steps

The review form should now work correctly for both authenticated and anonymous users.
