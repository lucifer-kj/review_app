# Review Page Troubleshooting Guide

## Issues Identified

The review page may not be working due to several potential issues:

### 1. **Database Migration Not Applied**
The review page requires specific RLS policies and database functions to work properly.

**Solution**: Run the migration script:
```sql
-- Copy and paste the contents of scripts/apply-review-fix.sql into your Supabase SQL Editor
```

### 2. **Authentication Issues**
The review page requires proper authentication to access reviews.

**Check**: 
- Are you logged in to the application?
- Is your session valid?
- Check browser console for authentication errors

### 3. **RLS Policy Conflicts**
Row Level Security policies might be preventing access to reviews.

**Symptoms**:
- "new row violates row-level security policy" errors
- Empty review lists
- 401 Unauthorized errors

### 4. **Service Layer Issues**
The ReviewService has been updated to use new database functions.

**Check**: 
- Browser console for JavaScript errors
- Network tab for failed API calls

## Step-by-Step Fix

### Step 1: Apply Database Fixes
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/apply-review-fix.sql`
4. Run the script
5. Check for success message: "Review page fixes applied successfully!"

### Step 2: Verify Authentication
1. Log out and log back in
2. Check if you can access other dashboard pages
3. Verify your user session is active

### Step 3: Test Review Page
1. Navigate to `/reviews` page
2. Check browser console for errors
3. Try refreshing the page
4. Test search and filter functionality

### Step 4: Check Network Requests
1. Open browser DevTools
2. Go to Network tab
3. Navigate to reviews page
4. Look for failed requests to Supabase
5. Check response status codes

## Common Error Messages

### "new row violates row-level security policy"
- **Cause**: RLS policies not properly configured
- **Fix**: Apply the migration script

### "User not authenticated"
- **Cause**: Session expired or invalid
- **Fix**: Log out and log back in

### "Dashboard function not found"
- **Cause**: Database functions not created
- **Fix**: Apply the migration script

### "Failed to fetch reviews"
- **Cause**: Network or authentication issue
- **Fix**: Check network connection and authentication

## Debugging Steps

### 1. Check Browser Console
```javascript
// Add this to your browser console to test
const { data, error } = await supabase.rpc('get_all_reviews_for_dashboard');
console.log('Reviews:', data);
console.log('Error:', error);
```

### 2. Test Database Functions
```sql
-- Test the dashboard function
SELECT * FROM get_all_reviews_for_dashboard();

-- Test the stats function
SELECT * FROM get_review_stats_for_dashboard();
```

### 3. Check RLS Policies
```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reviews';
```

## Expected Behavior After Fix

1. **Reviews Page Loads**: Should display all reviews (user's + anonymous)
2. **Search Works**: Should filter reviews by name or phone
3. **Rating Filter Works**: Should filter by high/low ratings
4. **Pagination Works**: Should handle large datasets
5. **Actions Work**: View feedback, Google review links, etc.

## If Issues Persist

1. **Clear Browser Cache**: Hard refresh (Ctrl+F5)
2. **Check Supabase Logs**: Look for errors in Supabase dashboard
3. **Verify Environment Variables**: Ensure Supabase URL and key are correct
4. **Test with Different Browser**: Rule out browser-specific issues
5. **Check Network**: Ensure stable internet connection

## Contact Support

If the issue persists after following these steps:
1. Collect browser console errors
2. Note the exact error messages
3. Check Supabase logs for database errors
4. Provide steps to reproduce the issue
