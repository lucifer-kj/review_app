# Supabase Email Template Fix

## 🚨 CRITICAL: Fix Email Template in Supabase Dashboard

The magic link is generating malformed URLs with double question marks. This needs to be fixed in your Supabase Dashboard.

### **Step 1: Access Email Templates**

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Email Templates**
3. Find the **Magic Link** template

### **Step 2: Update Magic Link Template**

Replace the current template with this corrected version:

```html
<h2>Your Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>

<p>If the link doesn't work, copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

### **Step 3: Alternative Template (If Above Doesn't Work)**

If you're still having issues, use this template that manually constructs the URL:

```html
<h2>Your Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Log In</a></p>

<p>If the link doesn't work, copy and paste this URL into your browser:</p>
<p>{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email</p>
```

### **Step 4: Verify Redirect URLs**

Make sure your Supabase Dashboard has these redirect URLs configured:

**Authentication** → **URL Configuration**:
- **Site URL**: `https://demo.alphabusinessdesigns.co.in`
- **Redirect URLs**:
  - `https://demo.alphabusinessdesigns.co.in/auth/callback`
  - `https://demo.alphabusinessdesigns.co.in/auth/callback/**`

### **Step 5: Test the Fix**

1. Save the email template
2. Try sending a magic link invitation
3. Check if the URL is properly formatted (no double question marks)

## **Expected URL Format**

The magic link should look like this:
```
https://demo.alphabusinessdesigns.co.in/auth/callback?token_hash=ABC123&type=email
```

**NOT like this:**
```
https://demo.alphabusinessdesigns.co.in/auth/callback?type=invite?token_hash=ABC123&type=email
```

## **Why This Happens**

The issue occurs when:
1. The email template uses incorrect URL construction
2. Multiple redirect parameters are concatenated incorrectly
3. The `redirectTo` parameter conflicts with the template's URL construction

## **Additional Debugging**

If you're still having issues, you can test the callback route directly:

1. Visit: `https://demo.alphabusinessdesigns.co.in/test-callback?test=123&type=email`
2. This should show you the URL parameters being received
3. Use this to debug any remaining issues
