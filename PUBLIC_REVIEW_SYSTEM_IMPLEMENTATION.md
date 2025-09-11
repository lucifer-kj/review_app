# Public Review System Implementation

## Overview

This document describes the implementation of a public review submission system for the multi-tenant Crux platform. The system allows anonymous users to submit reviews directly to specific tenants without requiring authentication.

## Key Features

### 1. Public Review URLs
- Each tenant gets a unique public URL: `https://yourapp.com/review/[tenantId]`
- URLs are automatically generated when tenants are created
- URLs are displayed in the master dashboard for easy sharing

### 2. Anonymous Review Submission
- No login required for review submission
- Secure tenant validation ensures reviews go to the correct tenant
- Form customization based on tenant settings

### 3. Multi-tenant Security
- Row Level Security (RLS) policies ensure tenant isolation
- Anonymous users can only submit reviews to active tenants
- Database functions validate tenant existence before review submission

## Implementation Details

### Database Schema

#### New Migration: `20250118000000_enhance_public_review_access.sql`

**Key Functions:**
- `get_tenant_for_public_review(tenant_id)` - Fetches tenant info for public forms
- `submit_public_review(...)` - Securely submits reviews with validation

**RLS Policies:**
- `anonymous_review_insert_secure` - Allows anonymous review inserts only for active tenants

### Frontend Components

#### 1. PublicReviewForm (`src/pages/PublicReviewForm.tsx`)
- Fetches tenant information dynamically
- Displays tenant-specific branding and customization
- Handles form validation and submission
- Redirects to Google Reviews for high ratings (4-5 stars)
- Shows thank you page for lower ratings

#### 2. Updated App Routing (`src/App.tsx`)
- Route: `/review/:tenantId` → `PublicReviewForm`
- Test route: `/test-public-review` → `TestPublicReview`

#### 3. Tenant Management Integration
- **TenantCreateWizard**: Shows generated review URL after tenant creation
- **TenantDetails**: Displays review URL with copy-to-clipboard functionality

### Security Features

1. **Tenant Validation**: Reviews can only be submitted to active tenants
2. **RLS Policies**: Database-level security prevents cross-tenant access
3. **Input Validation**: Client and server-side validation for all form fields
4. **Rate Limiting**: Ready for implementation (not yet added)

## Usage Flow

### For Super Admins
1. Create a new tenant via master dashboard
2. System automatically generates public review URL
3. URL is displayed in tenant details with copy functionality
4. Share URL with customers for review collection

### For Customers (Anonymous Users)
1. Visit the public review URL
2. Form loads with tenant-specific branding
3. Fill out review form (name and rating required)
4. Submit review
5. High ratings (4-5 stars) redirect to Google Reviews
6. Lower ratings show thank you page

### For Tenant Admins
1. View review URL in tenant details
2. Copy URL to share with customers
3. Reviews appear in their dashboard

## Testing

### Test Page
Visit `/test-public-review` to test the system with the demo tenant.

### Demo Tenant
- **ID**: `36dcb9ba-9dec-4cb1-9465-a084e73329c4`
- **URL**: `/review/36dcb9ba-9dec-4cb1-9465-a084e73329c4`

### Test Scenarios
1. **Valid Tenant**: Form loads with tenant information
2. **Invalid Tenant**: Shows error message
3. **Form Validation**: Required fields properly validated
4. **Review Submission**: Successfully saves to database
5. **Rating Redirects**: High ratings redirect to Google Reviews
6. **Customization**: Form styling matches tenant settings

## Database Functions

### `get_tenant_for_public_review(tenant_id UUID)`
Returns tenant and business information for public review forms.

**Returns:**
- `id`, `name`, `status`
- `business_name`, `business_email`, `business_phone`
- `business_address`, `google_business_url`
- `form_customization` (JSONB)

### `submit_public_review(...)`
Securely submits a review with validation.

**Parameters:**
- `p_tenant_id` - Target tenant ID
- `p_customer_name` - Customer name (required)
- `p_customer_email` - Customer email (optional)
- `p_customer_phone` - Customer phone (optional)
- `p_country_code` - Country code (default: +1)
- `p_rating` - Rating 1-5 (required)
- `p_review_text` - Review text (optional)
- `p_metadata` - Additional metadata (JSONB)

**Returns:**
- `success` - Boolean indicating success
- `review_id` - UUID of created review
- `message` - Status message

## Configuration

### Environment Variables
The system uses the following environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_FRONTEND_URL` - Frontend URL for generating review URLs

### Tenant Settings
Each tenant can customize:
- `primary_color` - Form primary color
- `secondary_color` - Form secondary color
- `welcome_message` - Custom welcome message
- `thank_you_message` - Custom thank you message
- `required_fields` - Array of required form fields
- `optional_fields` - Array of optional form fields

## Security Considerations

1. **Tenant Isolation**: RLS policies ensure reviews are properly isolated
2. **Input Validation**: All inputs are validated on both client and server
3. **Rate Limiting**: Ready for implementation to prevent spam
4. **Audit Logging**: All review submissions can be logged for compliance
5. **Data Privacy**: Customer data is handled according to tenant settings

## Future Enhancements

1. **Rate Limiting**: Implement rate limiting to prevent spam
2. **CAPTCHA**: Add CAPTCHA for additional spam protection
3. **Email Notifications**: Notify tenant admins of new reviews
4. **Review Moderation**: Allow tenants to moderate reviews before publishing
5. **Analytics**: Track review form performance and conversion rates
6. **Custom Domains**: Allow tenants to use custom domains for review URLs

## Troubleshooting

### Common Issues

1. **Form Not Loading**: Check if tenant exists and is active
2. **Review Not Submitting**: Verify RLS policies are correctly applied
3. **Styling Issues**: Check tenant customization settings
4. **Redirect Issues**: Verify Google Business URL is set for tenant

### Debug Steps

1. Check browser console for errors
2. Verify tenant ID in URL is correct
3. Check Supabase logs for database errors
4. Test with demo tenant first
5. Verify RLS policies are enabled

## Conclusion

The public review system is now fully implemented and ready for production use. It provides a secure, scalable solution for collecting customer reviews across multiple tenants while maintaining proper isolation and security.
