# Environment Variables Setup Guide

## 🔧 Quick Fix for Current Error

The application is currently failing because it's looking for environment variables with the `VITE_` prefix. Here's how to fix it:

### 1. Create/Update Your `.env` File

Create a `.env` file in your project root with these variables:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service Configuration (Resend)
RESEND_API_KEY=your_resend_api_key

# Email Configuration
EMAIL_DOMAIN=yourdomain.com
EMAIL_FROM_NAME=noreply
EMAIL_TEMPLATE=default
EMAIL_PRIMARY_COLOR=#007bff
EMAIL_BUTTON_TEXT=Leave a Review
EMAIL_TITLE=We'd love your feedback!

# Frontend Configuration
VITE_FRONTEND_URL=https://yourdomain.com

# Security Configuration
VITE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# Optional: Error Tracking (Sentry)
VITE_SENTRY_DSN=your_sentry_dsn

# Optional: Analytics
VITE_GA_TRACKING_ID=your_ga_tracking_id
```

### 2. For Vercel Deployment

Set these environment variables in your Vercel dashboard:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add RESEND_API_KEY
```

## 📋 Environment Variables Explained

### Client-Side Variables (Browser)
These variables are accessible in the browser and **MUST** be prefixed with `VITE_`:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_FRONTEND_URL` - Your frontend application URL
- `VITE_ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `VITE_SENTRY_DSN` - Sentry error tracking DSN
- `VITE_GA_TRACKING_ID` - Google Analytics tracking ID

### Server-Side Variables (Edge Functions)
These variables are used in Supabase Edge Functions and use **standard names**:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `RESEND_API_KEY` - Resend email service API key
- `EMAIL_DOMAIN` - Your email domain
- `FRONTEND_URL` - Your frontend application URL

## 🚀 Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the following values:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_ANON_KEY`

## 🔧 Setting Up Edge Functions

For Supabase Edge Functions, set these secrets:

```bash
supabase secrets set SUPABASE_URL=your_supabase_project_url
supabase secrets set SUPABASE_ANON_KEY=your_supabase_anon_key
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set EMAIL_DOMAIN=yourdomain.com
supabase secrets set FRONTEND_URL=https://yourdomain.com
```

## ✅ Verification Steps

1. **Local Development**:
   ```bash
   # Start the development server
   npm run dev
   ```
   The app should load without environment variable errors.

2. **Production Deployment**:
   - Set environment variables in your hosting platform
   - Deploy the application
   - Check that the app loads correctly

## 🚨 Common Issues

### Issue: "Missing required environment variables"
**Solution**: Ensure your `.env` file exists and contains the required variables with `VITE_` prefix.

### Issue: "401 Unauthorized" errors
**Solution**: Check that your Supabase credentials are correct and the project is active.

### Issue: Edge Functions not working
**Solution**: Ensure server-side environment variables are set without the `VITE_` prefix.

## 📞 Need Help?

If you're still experiencing issues:

1. Check that your `.env` file is in the project root
2. Verify that Supabase credentials are correct
3. Restart your development server after adding environment variables
4. Check the browser console for specific error messages
