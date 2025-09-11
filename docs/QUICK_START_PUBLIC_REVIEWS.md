# Quick Start Guide: Multi-Tenant Public Review URLs

This guide will help you quickly set up and test the new multi-tenant public review URL system.

## Prerequisites

- Supabase project with admin access
- Node.js and npm/bun installed
- Supabase CLI installed (`npm install -g supabase`)

## Step 1: Deploy Database Schema

```bash
# Apply the migration
supabase db push

# Or manually run the SQL
supabase db reset
```

## Step 2: Deploy Edge Functions

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export BASE_DOMAIN="https://your-domain.com"

# Deploy functions (Windows)
scripts\deploy-edge-functions.bat

# Deploy functions (Linux/Mac)
chmod +x scripts/deploy-edge-functions.sh
./scripts/deploy-edge-functions.sh
```

## Step 3: Update Environment Variables

Create or update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BASE_DOMAIN=https://your-domain.com
```

## Step 4: Test the System

### 4.1 Create a Test Tenant

```sql
-- Run in Supabase SQL Editor
INSERT INTO public.tenants (id, name, status, created_by) 
VALUES ('test-tenant-1', 'Test Restaurant', 'active', 'your-user-id');

-- Add yourself as tenant owner
INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES ('test-tenant-1', 'your-user-id', 'owner');
```

### 4.2 Set Up Business Settings

1. Log into your app
2. Go to Dashboard Settings
3. Fill in:
   - Business Name: "Test Restaurant"
   - Google Review URL: "https://maps.google.com/search?q=test+restaurant"
4. Click "Generate Review URL"

### 4.3 Test Public Review Page

1. Copy the generated review URL
2. Open it in a new browser tab (or incognito mode)
3. Submit a test review with rating 4 or 5
4. Verify you're redirected to Google Reviews

### 4.4 Test Feedback Flow

1. Submit a test review with rating 1, 2, or 3
2. Verify you're redirected to the feedback form
3. Submit feedback
4. Verify you see the thank you page

## Step 5: Verify RLS Policies

Run the comprehensive test suite:

```bash
# Run in Supabase SQL Editor
psql -h your-db-host -U postgres -d postgres -f scripts/test-rls-policies.sql
```

## Step 6: Test Cross-Tenant Isolation

### 6.1 Create Second Tenant

```sql
INSERT INTO public.tenants (id, name, status, created_by) 
VALUES ('test-tenant-2', 'Another Restaurant', 'active', 'your-user-id');

INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES ('test-tenant-2', 'your-user-id', 'owner');
```

### 6.2 Test Data Isolation

1. Log in as tenant 1 user
2. Verify you only see tenant 1 data
3. Try to access tenant 2 data (should fail)
4. Repeat for tenant 2

## Common Issues and Solutions

### Issue: Review URL Not Generated

**Symptoms**: Button is disabled or shows error

**Solutions**:
1. Check that business name is provided
2. Verify Google review URL is valid
3. Check browser console for errors
4. Verify Edge Function is deployed

### Issue: Anonymous Reviews Not Submitting

**Symptoms**: Form submission fails

**Solutions**:
1. Check RLS policies are applied
2. Verify tenant exists and is active
3. Check Edge Function logs
4. Ensure slug is valid

### Issue: Cross-Tenant Data Leakage

**Symptoms**: Users see other tenants' data

**Solutions**:
1. Run RLS policy tests
2. Check user context in database
3. Verify tenant_users relationships
4. Review RLS policy definitions

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Edge Functions deployed and accessible
- [ ] Environment variables configured
- [ ] Test tenant created
- [ ] Business settings saved
- [ ] Review URL generated
- [ ] Public review page loads
- [ ] High rating redirects to Google
- [ ] Low rating goes to feedback form
- [ ] Feedback submission works
- [ ] RLS policies prevent cross-tenant access
- [ ] Anonymous submissions work
- [ ] Authenticated user isolation works

## Next Steps

1. **Production Deployment**: Follow the full deployment guide
2. **Custom Branding**: Update tenant branding settings
3. **Email Integration**: Set up email service for review requests
4. **Analytics**: Implement tracking for review submissions
5. **Monitoring**: Set up alerts for system health

## Support

If you encounter issues:

1. Check the troubleshooting section in the main documentation
2. Review Supabase logs for errors
3. Test with the provided SQL scripts
4. Contact support with specific error messages

## Development Tips

### Local Development

```bash
# Start Supabase locally
supabase start

# Run migrations
supabase db reset

# Deploy functions locally
supabase functions deploy generate-review-url
supabase functions deploy submit-public-review
```

### Debugging

```bash
# Check function logs
supabase functions logs generate-review-url
supabase functions logs submit-public-review

# Test functions locally
curl -X POST http://localhost:54321/functions/v1/generate-review-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-service-role-key" \
  -d '{"tenant_id":"test-tenant-1","business_name":"Test","google_review_url":"https://maps.google.com"}'
```

### Database Queries

```sql
-- Check tenant settings
SELECT id, name, business_name, google_review_url, slug, review_url 
FROM public.tenants 
WHERE status = 'active';

-- Check recent reviews
SELECT id, tenant_id, reviewer_name, rating, created_at 
FROM public.reviews 
ORDER BY created_at DESC 
LIMIT 10;

-- Test slug generation
SELECT public.generate_slug('My Test Business');
```

This quick start guide should get you up and running with the new public review URL system in under 30 minutes!
