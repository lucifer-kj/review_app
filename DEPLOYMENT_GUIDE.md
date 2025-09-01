# Review Email System Deployment Guide

## 🚀 Deploying the Review Email System

### 1. Deploy Supabase Edge Function

```bash
# Navigate to your project directory
cd /path/to/your/project

# Deploy the new send-review-email function
supabase functions deploy send-review-email

# Verify deployment
supabase functions list
```

### 2. Environment Variables Setup

Add these environment variables to your Supabase project:

```bash
# Required: Resend API Key
RESEND_API_KEY=re_your_resend_api_key_here

# Required: Frontend URL for email links
FRONTEND_URL=https://yourdomain.com

# Optional: Custom business name (defaults to "Alpha Business Designs")
BUSINESS_NAME=Your Business Name
```

To set environment variables:
```bash
# Using Supabase CLI
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set FRONTEND_URL=https://yourdomain.com

# Or set them in the Supabase Dashboard under Settings > Edge Functions
```

### 3. Database Schema Verification

Ensure your `reviews` table has the required columns:

```sql
-- Check if these columns exist in your reviews table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND column_name IN ('name', 'phone', 'country_code', 'rating', 'google_review', 'redirect_opened', 'metadata', 'feedback');
```

If missing, add them:
```sql
-- Add feedback column if missing
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add metadata column if missing  
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### 4. RLS Policy Verification

Ensure your RLS policies allow the necessary operations:

```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reviews';

-- If needed, add policy for anonymous inserts (for email form)
CREATE POLICY "Anyone can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);
```

### 5. Frontend Deployment

Build and deploy your frontend with the new components:

```bash
# Build for production
npm run build

# Deploy to your hosting platform
# Vercel
vercel --prod

# Netlify  
netlify deploy --prod --dir=dist

# Or upload dist/ folder to your web server
```

### 6. Testing the Deployment

1. **Test Email Function**:
   ```bash
   # Test the function directly
   curl -X POST https://your-project.supabase.co/functions/v1/send-review-email \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "customerEmail": "test@example.com",
       "customerName": "Test User"
     }'
   ```

2. **Test Frontend Routes**:
   - Visit `/review-form` - should show the email-triggered review form
   - Visit `/review/feedback` - should show feedback form (with state)
   - Visit `/review/thank-you` - should show thank you page (with state)

3. **Test Dashboard Integration**:
   - Login to dashboard
   - Go to Reviews page
   - Click "Send Review Request" button
   - Fill form and send test email

### 7. Production Checklist

- [ ] Resend API key configured
- [ ] Frontend URL environment variable set
- [ ] Edge function deployed successfully
- [ ] Database schema up to date
- [ ] RLS policies configured
- [ ] Frontend deployed with new routes
- [ ] Email templates tested
- [ ] Review flow tested end-to-end
- [ ] Error handling verified
- [ ] Rate limiting configured (recommended)

### 8. Monitoring & Analytics

Set up monitoring for:
- Email delivery rates
- Review form completion rates
- Function execution logs
- Database performance

```bash
# View function logs
supabase functions logs send-review-email

# Monitor email delivery in Resend dashboard
# Check review completion rates in your database
```

### 9. Customization Options

#### Email Template Customization
Edit `supabase/functions/send-review-email/index.ts` to customize:
- Email subject line
- Email content and styling
- Business branding
- Call-to-action button text

#### Form Customization
Edit the React components to customize:
- Form fields and validation
- Styling and branding
- Thank you page content
- Feedback collection flow

### 10. Troubleshooting

#### Common Issues:

**Email not sending**:
- Check Resend API key is valid
- Verify function is deployed
- Check function logs for errors

**Form not loading**:
- Verify routes are configured in App.tsx
- Check for JavaScript errors in browser console
- Ensure all components are properly imported

**Database errors**:
- Check RLS policies allow inserts
- Verify table schema matches expectations
- Check for foreign key constraints

**CORS issues**:
- Verify CORS headers in function
- Check if frontend URL is whitelisted
- Test with different browsers

### 11. Security Considerations

- Rate limiting on email sending
- Input validation and sanitization
- Secure API key storage
- HTTPS enforcement
- Content Security Policy headers

### 12. Performance Optimization

- Email template caching
- Database query optimization
- Frontend code splitting
- CDN for static assets
- Function cold start optimization

---

## 🎉 Success!

Once deployed and tested, your review email system will:
- Send professional review request emails
- Collect customer feedback through a branded form
- Route high ratings to Google Reviews
- Collect detailed feedback for low ratings
- Track all interactions with metadata
- Provide analytics on review collection rates
