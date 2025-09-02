# Security Configuration Guide

## 🔐 Critical Security Requirements

### Environment Variables Setup

**⚠️ NEVER commit API keys or sensitive configuration to version control**

#### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service Configuration (REQUIRED for email functions)
RESEND_API_KEY=your_resend_api_key

# Email Configuration
EMAIL_DOMAIN=yourdomain.com
EMAIL_FROM_NAME=noreply
EMAIL_TEMPLATE=default
EMAIL_PRIMARY_COLOR=#007bff
EMAIL_BUTTON_TEXT=Leave a Review
EMAIL_TITLE=We'd love your feedback!

# Frontend Configuration
FRONTEND_URL=https://yourdomain.com

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com
```

#### Environment Variable Validation

The application will automatically validate required environment variables on startup. Missing variables will cause the application to fail with clear error messages.

### Security Best Practices

#### 1. Environment File Management
- ✅ Use `.env` for local development
- ✅ Use `.env.local` for local overrides
- ✅ Use `.env.production` for production settings
- ❌ NEVER commit `.env` files to version control
- ✅ Use `env.example` as a template

#### 2. API Key Security
- ✅ Rotate API keys regularly
- ✅ Use different keys for different environments
- ✅ Monitor API key usage
- ❌ Never share API keys in code reviews
- ❌ Never log API keys

#### 3. CORS Configuration
- ✅ Configure `ALLOWED_ORIGINS` for production
- ✅ Use HTTPS in production
- ✅ Limit origins to trusted domains only

#### 4. Supabase Security
- ✅ Use Row Level Security (RLS) policies
- ✅ Validate user permissions
- ✅ Use service role keys only on the server
- ✅ Use anon keys only for public operations

### Deployment Security

#### Vercel Deployment
```bash
# Set environment variables in Vercel dashboard
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add RESEND_API_KEY
```

#### Supabase Edge Functions
```bash
# Set environment variables for Edge Functions
supabase secrets set RESEND_API_KEY=your_key
supabase secrets set EMAIL_DOMAIN=yourdomain.com
supabase secrets set FRONTEND_URL=https://yourdomain.com
```

### Security Checklist

- [ ] All API keys moved to environment variables
- [ ] `.env` files added to `.gitignore`
- [ ] Environment variables validated on startup
- [ ] CORS origins configured for production
- [ ] Supabase RLS policies implemented
- [ ] API key rotation schedule established
- [ ] Security monitoring configured
- [ ] Error tracking without sensitive data

### Emergency Procedures

If API keys are compromised:

1. **Immediate Actions**
   - Rotate all affected API keys
   - Review access logs
   - Update environment variables

2. **Investigation**
   - Check Git history for exposed keys
   - Review deployment logs
   - Monitor for unauthorized usage

3. **Prevention**
   - Implement key rotation automation
   - Add security scanning to CI/CD
   - Review security practices

### Contact Information

For security issues, contact:
- Security Team: security@yourdomain.com
- Emergency: +1-XXX-XXX-XXXX
