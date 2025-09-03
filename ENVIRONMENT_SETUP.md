# Environment Setup Guide

This guide will help you set up the environment variables needed for the Alpha Business Designs review system.

## Prerequisites

- A Supabase project (already created: `elhbthnvwcqewjpwulhq`)
- Access to your Supabase dashboard

## Step 1: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `elhbthnvwcqewjpwulhq`
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL**: `https://elhbthnvwcqewjpwulhq.supabase.co`
   - **anon public** key (starts with `eyJ...`)

## Step 2: Create Environment File

Create a `.env` file in your project root with the following content:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://elhbthnvwcqewjpwulhq.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here

# Email Service Configuration (Resend)
RESEND_API_KEY=your_resend_api_key

# Email Configuration
EMAIL_DOMAIN=alphabusiness.com
EMAIL_FROM_NAME=noreply
EMAIL_TEMPLATE=default
EMAIL_PRIMARY_COLOR=#007bff
EMAIL_BUTTON_TEXT=Leave a Review
EMAIL_TITLE=We'd love your feedback!

# Frontend Configuration
VITE_FRONTEND_URL=http://localhost:8081

# Security Configuration
VITE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8081

# Optional: Error Tracking (Sentry)
VITE_SENTRY_DSN=your_sentry_dsn

# Optional: Analytics
VITE_GA_TRACKING_ID=your_ga_tracking_id
```

## Step 3: Run Database Migrations

The database schema needs to be updated to support the review form. Run the following command:

```bash
npx supabase db push
```

This will apply the migration that adds the `phone` and `country_code` columns to the `reviews` table.

## Step 4: Verify Configuration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:8081/review`
3. Try submitting a test review
4. Check the browser console for any errors

## Troubleshooting

### 401 Unauthorized Error
- Ensure your Supabase anon key is correct
- Check that the database migrations have been applied
- Verify RLS policies allow public access

### Database Schema Errors
- Run `npx supabase db push` to apply migrations
- Check that the `reviews` table has the correct columns

### Environment Variables Not Loading
- Ensure the `.env` file is in the project root
- Restart the development server after creating the file
- Check that variable names start with `VITE_`

## Security Notes

- Never commit your `.env` file to version control
- The anon key is safe to use in the frontend (it's designed for public access)
- RLS policies ensure data security at the database level

## Next Steps

Once the environment is configured:

1. Test the review form submission
2. Set up email notifications (optional)
3. Configure Google Reviews integration
4. Deploy to production

For production deployment, update the `VITE_FRONTEND_URL` and `VITE_ALLOWED_ORIGINS` to match your production domain.
