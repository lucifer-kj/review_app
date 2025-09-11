# Multi-Tenant Public Review URL System

## Overview

The Multi-Tenant Public Review URL System enables each tenant to generate and manage their own public review URLs with slug-based routing. This system allows customers to submit reviews anonymously without requiring authentication, while maintaining strict tenant isolation and security.

## Key Features

- **Slug-based URLs**: Clean, shareable URLs like `https://yourapp.com/review/acme-restaurant`
- **Anonymous Submissions**: Customers can submit reviews without creating accounts
- **Rating-based Routing**: High ratings (4-5) redirect to Google Reviews, low ratings (1-3) go to internal feedback
- **Tenant Isolation**: Strict RLS policies prevent cross-tenant data access
- **Business Settings Enforcement**: Tenants must provide business name and Google review URL before URL generation
- **Branding Support**: Custom logos, colors, and styling for public review pages

## System Architecture

### Database Schema

#### Tenants Table Updates
```sql
ALTER TABLE public.tenants 
ADD COLUMN business_name TEXT,
ADD COLUMN google_review_url TEXT,
ADD COLUMN slug TEXT UNIQUE,
ADD COLUMN review_url TEXT,
ADD COLUMN branding JSONB DEFAULT '{}';
```

#### New Tenant Users Table
```sql
CREATE TABLE public.tenant_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'staff')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);
```

#### Reviews Table Updates
```sql
ALTER TABLE public.reviews 
ADD COLUMN reviewer_name TEXT,
ADD COLUMN reviewer_email TEXT,
ADD COLUMN reviewer_phone TEXT,
ADD COLUMN feedback_text TEXT,
ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN source TEXT DEFAULT 'public_form',
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Make user_id nullable for anonymous submissions
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
```

### Edge Functions

#### 1. generate-review-url
- **Purpose**: Generates unique slugs and creates public review URLs
- **Input**: `tenant_id`, `business_name`, `google_review_url`, `branding`
- **Output**: `slug`, `review_url`
- **Security**: Uses service role key, validates input, checks tenant permissions

#### 2. submit-public-review
- **Purpose**: Handles anonymous review submissions
- **Input**: `slug`, `reviewer_name`, `reviewer_email`, `reviewer_phone`, `rating`, `feedback_text`
- **Output**: `review_id`, `redirect_url`
- **Security**: Uses anon key, validates tenant exists and is active

### Frontend Components

#### PublicReviewPage
- **Route**: `/review/:slug`
- **Purpose**: Public-facing review submission form
- **Features**: 
  - Tenant branding display
  - Star rating interface
  - Optional reviewer information
  - Rating-based redirect logic

#### BusinessSettingsForm
- **Purpose**: Tenant settings for business information
- **Requirements**: Business name and Google review URL must be provided
- **Features**:
  - URL generation trigger
  - Branding customization
  - Copy-to-clipboard functionality

#### FeedbackPage (Updated)
- **Route**: `/feedback`
- **Purpose**: Internal feedback collection for low ratings
- **Features**:
  - URL parameter support
  - Review ID tracking
  - Database update functionality

## Security Implementation

### Row Level Security (RLS) Policies

#### Tenants Table
```sql
CREATE POLICY "tenants_tenant_isolation" ON public.tenants
  FOR ALL USING (
    public.is_super_admin() OR
    id IN (
      SELECT tu.tenant_id FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid()
    )
  );
```

#### Reviews Table
```sql
-- Allow anonymous inserts for public review submissions
CREATE POLICY "reviews_anonymous_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    tenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.tenants t 
      WHERE t.id = tenant_id 
        AND t.status = 'active'
        AND t.business_name IS NOT NULL
        AND t.google_review_url IS NOT NULL
    )
  );
```

#### Tenant Users Table
```sql
CREATE POLICY "tenant_users_tenant_isolation" ON public.tenant_users
  FOR ALL USING (
    public.is_super_admin() OR
    user_id = auth.uid() OR
    tenant_id IN (
      SELECT tu.tenant_id FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid() AND tu.role IN ('owner', 'admin')
    )
  );
```

### Input Validation

#### Google Review URL Validation
```typescript
const googleUrlPattern = /^https:\/\/(www\.)?google\.com\/search\?.*q=.*|^https:\/\/(www\.)?maps\.google\.com\/.*|^https:\/\/g\.co\/.*|^https:\/\/goo\.gl\/.*/;
```

#### Rating Validation
- Must be integer between 1-5
- Required field for all submissions

#### Slug Generation
- Converts business name to lowercase
- Replaces non-alphanumeric characters with hyphens
- Ensures uniqueness across all tenants
- Handles duplicates with numeric suffixes

## API Endpoints

### Generate Review URL
```http
POST /functions/v1/generate-review-url
Content-Type: application/json
Authorization: Bearer <service_role_key>

{
  "tenant_id": "uuid",
  "business_name": "Acme Restaurant",
  "google_review_url": "https://maps.google.com/...",
  "branding": {
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#3b82f6",
    "secondary_color": "#ffffff"
  }
}
```

### Submit Public Review
```http
POST /functions/v1/submit-public-review
Content-Type: application/json
Authorization: Bearer <anon_key>

{
  "slug": "acme-restaurant",
  "reviewer_name": "John Doe",
  "reviewer_email": "john@example.com",
  "rating": 4,
  "feedback_text": "Great food and service!"
}
```

## User Flows

### 1. Tenant Setup Flow
1. Super admin creates tenant
2. Tenant admin logs in
3. System checks for required business settings
4. If missing, redirects to business settings form
5. User provides business name and Google review URL
6. System generates unique slug and review URL
7. User can now share the public review URL

### 2. Customer Review Flow
1. Customer visits public review URL (`/review/acme-restaurant`)
2. System loads tenant information and branding
3. Customer submits rating and optional feedback
4. If rating ≥ 4: Redirect to Google Reviews
5. If rating ≤ 3: Redirect to internal feedback form
6. Review is stored with proper tenant isolation

### 3. Feedback Collection Flow
1. Customer redirected to `/feedback?review_id=xxx&name=John&rating=3`
2. Customer provides detailed feedback
3. System updates existing review record
4. Customer sees thank you page

## Environment Variables

### Required
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BASE_DOMAIN=https://your-domain.com
```

### Optional
```env
VITE_RESEND_API_KEY=your_resend_key
VITE_SENDGRID_API_KEY=your_sendgrid_key
VITE_SENTRY_DSN=your_sentry_dsn
```

## Deployment Instructions

### 1. Database Migration
```bash
# Apply the migration
supabase db push

# Or manually run the SQL
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250118000000_implement_public_review_urls.sql
```

### 2. Edge Functions Deployment
```bash
# Windows
scripts\deploy-edge-functions.bat

# Linux/Mac
chmod +x scripts/deploy-edge-functions.sh
./scripts/deploy-edge-functions.sh
```

### 3. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Update with your values
# Set BASE_DOMAIN to your production domain
# Set SUPABASE_SERVICE_ROLE_KEY for Edge Functions
```

### 4. Testing
```bash
# Run RLS policy tests
psql -h your-db-host -U postgres -d postgres -f scripts/test-rls-policies.sql

# Test Edge Functions via Supabase Dashboard
# Test public review URLs in browser
```

## Monitoring and Maintenance

### Logs to Monitor
- Edge Function execution logs
- RLS policy violations
- Anonymous review submission rates
- URL generation conflicts

### Key Metrics
- Review submission success rate
- Rating distribution
- Google redirect conversion rate
- Feedback form completion rate

### Maintenance Tasks
- Monitor slug uniqueness conflicts
- Review RLS policy effectiveness
- Update branding templates
- Clean up old test data

## Troubleshooting

### Common Issues

#### 1. Review URL Not Generated
- Check if business name and Google review URL are provided
- Verify tenant status is 'active'
- Check Edge Function logs for errors

#### 2. Anonymous Reviews Not Submitting
- Verify RLS policies are correctly applied
- Check if tenant exists and is active
- Ensure slug is valid and unique

#### 3. Cross-Tenant Data Leakage
- Run RLS policy tests
- Verify user context is properly set
- Check tenant_users table relationships

#### 4. Edge Function Errors
- Check environment variables are set
- Verify service role key permissions
- Review function logs in Supabase dashboard

### Debug Queries

```sql
-- Check tenant settings
SELECT id, name, business_name, google_review_url, slug, review_url 
FROM public.tenants 
WHERE status = 'active';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('tenants', 'reviews', 'tenant_users');

-- Test slug generation
SELECT public.generate_slug('Test Business Name');

-- Check tenant by slug
SELECT * FROM public.get_tenant_by_slug('test-business-name');
```

## Security Considerations

### Data Protection
- All personal data is encrypted in transit and at rest
- Anonymous reviews don't require PII collection
- RLS policies prevent unauthorized access

### Rate Limiting
- Implement rate limiting on public endpoints
- Consider CAPTCHA for high-volume submissions
- Monitor for abuse patterns

### Input Sanitization
- All user inputs are validated and sanitized
- SQL injection prevention through parameterized queries
- XSS prevention through proper escaping

### Audit Trail
- All administrative actions are logged
- Review submissions are tracked
- URL generation events are recorded

## Future Enhancements

### Planned Features
- QR code generation for review URLs
- Email templates for review requests
- Advanced analytics and reporting
- Multi-language support
- Mobile app integration

### Scalability Considerations
- Database indexing optimization
- CDN integration for static assets
- Caching strategies for tenant data
- Load balancing for Edge Functions

## Support and Documentation

### Additional Resources
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [React Router Documentation](https://reactrouter.com/)

### Contact
- Technical Support: support@yourcompany.com
- Documentation Issues: docs@yourcompany.com
- Security Concerns: security@yourcompany.com
