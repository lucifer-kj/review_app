# Supabase Edge Functions Deployment Guide

## CORS Issue Resolution

The CORS errors you're experiencing are due to improper configuration of the Supabase Edge Functions. Here's how to fix them:

## Step 1: Install Supabase CLI

### Option A: Using npm (if available)
```bash
npm install -g supabase
```

### Option B: Using PowerShell (Windows)
```powershell
# Download and install Supabase CLI
Invoke-WebRequest -Uri "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe" -OutFile "supabase.exe"
# Move to a directory in your PATH or use directly
```

### Option C: Using Chocolatey (if installed)
```bash
choco install supabase
```

## Step 2: Login to Supabase

```bash
supabase login
```

## Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference (found in your Supabase dashboard URL).

## Step 4: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific functions
supabase functions deploy submit-review
supabase functions deploy send-review-email
```

## Alternative: Manual Deployment via Dashboard

If you can't install the CLI, you can deploy manually:

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Go to Edge Functions**
   - Click on "Edge Functions" in the left sidebar

3. **Update the Functions**
   - Click on "submit-review" function
   - Replace the code with the updated version from `supabase/functions/submit-review/index.ts`
   - Click "Deploy"

4. **Repeat for send-review-email**
   - Update the `send-review-email` function with the code from `supabase/functions/send-review-email/index.ts`

## Step 5: Verify Environment Variables

Make sure these environment variables are set in your Supabase project:

1. **Go to Settings > API**
2. **Check that these are properly configured:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `ALLOWED_ORIGINS` (optional, will use defaults)

## Step 6: Test the Fix

After deployment, test your review form:

1. **Clear browser cache**
2. **Open browser developer tools**
3. **Try submitting a review**
4. **Check the Network tab for successful requests**

## Troubleshooting

### If you still get CORS errors:

1. **Check the function logs:**
   - Go to Supabase Dashboard > Edge Functions
   - Click on the function > Logs
   - Look for any errors

2. **Verify the function is deployed:**
   - The function should show as "Active" in the dashboard

3. **Check your frontend environment variables:**
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
   - These should match your Supabase project settings

### Common Issues:

1. **Wrong project reference:**
   - Make sure you're linked to the correct Supabase project

2. **Missing environment variables:**
   - Ensure all required environment variables are set in Supabase

3. **Function not deployed:**
   - Check that the function shows as "Active" in the dashboard

## Verification

After deployment, you should see:

1. **No CORS errors** in browser console
2. **Successful POST requests** to `/functions/v1/submit-review`
3. **Proper CORS headers** in the response
4. **Reviews being saved** to your database

## Next Steps

Once the CORS issue is resolved:

1. **Test the complete review flow**
2. **Monitor function logs** for any issues
3. **Set up proper monitoring** for production use

## Support

If you continue to have issues:

1. **Check Supabase documentation:** https://supabase.com/docs/guides/functions
2. **Review function logs** in the Supabase dashboard
3. **Verify network requests** in browser developer tools
4. **Contact Supabase support** if needed
