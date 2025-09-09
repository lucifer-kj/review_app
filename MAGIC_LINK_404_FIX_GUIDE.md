# Magic Link 404 Error Fix Guide

## Problem
Users are getting a 404 error when clicking on magic links for invitations. The URL shows:
```
https://demo.alphabusinessdesigns.co.in/auth/callback?type=invite#access_token=...
```

## Root Cause
The magic link is redirecting to `/auth/callback?type=invite` but the application expects users to go to `/accept-invitation` for the invitation flow.

## Solution Applied

### 1. ✅ Created AcceptInvitation Page
- **File**: `src/pages/AcceptInvitation.tsx`
- **Purpose**: Handles invitation acceptance with password setup
- **Features**:
  - Extracts email from URL parameters
  - Verifies magic link token
  - Allows users to set password and full name
  - Redirects to appropriate dashboard based on role

### 2. ✅ Updated Routing
- **File**: `src/App.tsx`
- **Changes**:
  - Added `/accept-invitation` route
  - Imported AcceptInvitation component
  - Route now properly handles invitation flow

### 3. ✅ Updated Magic Link Service
- **File**: `src/services/magicLinkService.ts`
- **Changes**:
  - Changed redirect URL from `/auth/callback?type=invite` to `/accept-invitation`
  - Updated both `inviteUserWithMagicLink` and `sendMagicLinkToUser` methods

### 4. ✅ Updated AuthCallback
- **File**: `src/pages/AuthCallback.tsx`
- **Changes**:
  - Added redirect to `/accept-invitation` for invitation flows
  - Maintains backward compatibility

## Required Supabase Configuration

### 1. Redirect URLs
In your Supabase Dashboard → Authentication → URL Configuration, add these URLs to the **Redirect URLs** allowlist:

```
http://localhost:5173/accept-invitation
https://demo.alphabusinessdesigns.co.in/accept-invitation
https://yourdomain.com/accept-invitation
```

### 2. Site URL
Make sure your **Site URL** is set to:
```
https://demo.alphabusinessdesigns.co.in
```

### 3. Email Templates
In Supabase Dashboard → Authentication → Email Templates, update the **Confirm signup** template to use:
```html
<a href="{{ .RedirectTo }}">Confirm your mail</a>
```

## Testing the Fix

### 1. Local Testing
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Create a test invitation through the master dashboard
3. Check the email for the magic link
4. Click the link - it should redirect to `http://localhost:5173/accept-invitation`

### 2. Production Testing
1. Deploy the application to `https://demo.alphabusinessdesigns.co.in`
2. Update Supabase redirect URLs as mentioned above
3. Test the invitation flow

## Environment Variables

Make sure your `.env` file contains:
```env
VITE_FRONTEND_URL=https://demo.alphabusinessdesigns.co.in
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Debugging Steps

If you still get 404 errors:

1. **Check Application Deployment**
   - Verify the app is running at `https://demo.alphabusinessdesigns.co.in`
   - Check if the `/accept-invitation` route is accessible

2. **Check Supabase Configuration**
   - Verify redirect URLs are added to Supabase
   - Check Site URL is correct
   - Verify email templates use `{{ .RedirectTo }}`

3. **Check Network Tab**
   - Look for any CORS errors
   - Check if the redirect is happening correctly

4. **Check Console Logs**
   - The AcceptInvitation component logs detailed information
   - Check browser console for any errors

## Files Modified

- ✅ `src/pages/AcceptInvitation.tsx` (new)
- ✅ `src/App.tsx` (routing)
- ✅ `src/services/magicLinkService.ts` (redirect URLs)
- ✅ `src/pages/AuthCallback.tsx` (invitation handling)

## Next Steps

1. Deploy the updated code to production
2. Update Supabase redirect URLs
3. Test the complete invitation flow
4. Monitor for any remaining issues

The 404 error should now be resolved, and users will be properly redirected to the invitation acceptance page.
