# Supabase Magic Link Configuration Guide

## Required Supabase Dashboard Configuration

To make the streamlined magic link system work properly, you need to configure these settings in your Supabase Dashboard.

### 1. **URL Configuration**

**Location**: Supabase Dashboard → Authentication → URL Configuration

**Add these URLs to the "Redirect URLs" allowlist**:
```
http://localhost:3000/auth/callback/**
http://localhost:5173/auth/callback/**
https://yourdomain.com/auth/callback/**
```

**Why needed**: Supabase requires explicit allowlist for security. Without this, magic link redirects will fail.

### 2. **Email Template Configuration**

**Location**: Supabase Dashboard → Authentication → Email Templates → "Invite user"

**Current template probably uses**:
```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Accept Invitation</a>
```

**Update to**:
```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite">Accept Invitation</a>
```

**Key changes**:
- Use `{{ .RedirectTo }}` instead of `{{ .SiteURL }}`
- Use `type=invite` instead of `type=email`

### 3. **Sample Email Template**

Here's a complete example of a professional invitation email template:

```html
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">You're Invited to Crux!</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #333; margin-top: 0;">Welcome to the team!</h2>
        <p style="color: #555; line-height: 1.6;">
            You've been invited to join <strong>{{ .Data.tenant_name }}</strong> on Crux, 
            our review management platform.
        </p>
        <p style="color: #555; line-height: 1.6;">
            Your role: <strong>{{ .Data.role }}</strong>
        </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite" 
           style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accept Invitation & Sign In
        </a>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #0066cc; font-size: 14px; word-break: break-all;">
            {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">
            This invitation will expire in 24 hours for security reasons.
        </p>
    </div>
</body>
</html>
```

### 4. **Environment Variables**

Make sure these are set in your `.env` file:

```env
# Required for magic link functionality
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Custom frontend URL
VITE_FRONTEND_URL=https://yourdomain.com
```

### 5. **Testing the Configuration**

After configuring the above settings:

1. **Create a test user** from the master dashboard
2. **Check email** for the invitation
3. **Verify the email template** looks correct
4. **Click the magic link** in the email
5. **Confirm redirect** works to `/auth/callback?type=invite`
6. **Verify user profile** is created with correct tenant association

### 6. **Troubleshooting**

#### **Magic link not working**:
- Check redirect URLs are added to Supabase allowlist
- Verify email template uses `{{ .RedirectTo }}`
- Check browser console for redirect errors

#### **Email not being sent**:
- Verify service role key is correct
- Check Supabase logs for invitation errors
- Ensure user doesn't already exist

#### **User profile not created**:
- Check `handle_new_user()` trigger exists and is enabled
- Verify metadata is being passed correctly
- Check Supabase logs for trigger errors

### 7. **Security Considerations**

- **Redirect URLs**: Only add trusted domains to the allowlist
- **Service Role Key**: Keep it secure and never expose in frontend code
- **Email expiry**: Supabase magic links expire after 24 hours by default
- **Rate limiting**: Supabase has built-in rate limiting for invitations

## Summary

Once these configurations are in place, your magic link invitation system will:

✅ Send professional-looking invitation emails
✅ Redirect users to the correct callback URL  
✅ Create user profiles with proper tenant association
✅ Provide a seamless onboarding experience

The system will use Supabase's native functionality exclusively, ensuring reliability and security.
