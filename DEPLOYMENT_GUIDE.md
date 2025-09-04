# Vercel Deployment Guide

## Pre-Deployment Checklist

### ✅ Environment Variables
Make sure these environment variables are set in your Vercel project:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### ✅ Build Configuration
- [ ] `vercel.json` is properly configured
- [ ] `vite.config.ts` has correct build settings
- [ ] `package.json` has correct build script

### ✅ Dependencies
- [ ] All dependencies are in `package.json`
- [ ] No missing peer dependencies
- [ ] Node.js version is compatible (18.x recommended)

## Common Deployment Issues & Solutions

### 1. **White Screen / Blank Page**

**Possible Causes:**
- Missing environment variables
- JavaScript errors preventing app from loading
- Incorrect base URL configuration

**Solutions:**
```bash
# Check environment variables in Vercel dashboard
# Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set

# Check browser console for errors
# Look for network errors or JavaScript exceptions
```

### 2. **404 Errors on Refresh**

**Cause:** SPA routing not properly configured

**Solution:** The `vercel.json` already includes proper rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. **Build Failures**

**Check:**
- Node.js version compatibility
- Missing dependencies
- TypeScript errors

**Solution:**
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### 4. **Environment Variable Issues**

**Symptoms:**
- App loads but features don't work
- Console warnings about missing variables
- Supabase connection errors

**Solution:**
```bash
# In Vercel dashboard, add these environment variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### 5. **CORS Issues**

**Symptoms:**
- Network errors in browser console
- Supabase API calls failing

**Solution:**
- Add your Vercel domain to Supabase allowed origins
- Check Supabase project settings

## Deployment Steps

### 1. **Prepare Your Project**
```bash
# Ensure clean build
npm run build

# Test locally
npm run preview
```

### 2. **Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. **Configure Environment Variables**
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add required variables

### 4. **Verify Deployment**
1. Check the deployed URL
2. Open browser developer tools
3. Look for any console errors
4. Test main functionality

## Debugging Steps

### 1. **Check Build Logs**
```bash
# View build logs in Vercel dashboard
# Look for any errors or warnings
```

### 2. **Browser Console**
```javascript
// Check for JavaScript errors
// Look for network request failures
// Verify environment variables are loaded
console.log('Environment:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  frontendUrl: import.meta.env.VITE_FRONTEND_URL
});
```

### 3. **Network Tab**
- Check if all assets are loading
- Look for 404 errors
- Verify API calls are working

### 4. **Environment Variable Debugging**
```javascript
// Add this to your main.tsx temporarily
console.log('Environment Variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
  VITE_FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL,
  NODE_ENV: import.meta.env.NODE_ENV
});
```

## Performance Optimization

### 1. **Bundle Analysis**
```bash
# Install bundle analyzer
npm install --save-dev vite-bundle-analyzer

# Add to vite.config.ts
import { visualizer } from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    react(),
    visualizer()
  ]
});
```

### 2. **Caching Headers**
The `vercel.json` already includes proper caching headers for static assets.

### 3. **Code Splitting**
The Vite config includes manual chunk splitting for better performance.

## Monitoring

### 1. **Error Tracking**
- Set up Sentry or similar error tracking
- Monitor for runtime errors
- Track user experience issues

### 2. **Performance Monitoring**
- Use Vercel Analytics
- Monitor Core Web Vitals
- Track loading times

## Troubleshooting Commands

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Test production build
npm run preview

# Check bundle size
npm run build && npx vite-bundle-analyzer

# Verify environment variables
node -e "console.log(process.env)"
```

## Support

If you're still experiencing issues:

1. **Check Vercel Status**: https://vercel-status.com
2. **Review Build Logs**: Look for specific error messages
3. **Test Locally**: Ensure the app works in development
4. **Check Dependencies**: Verify all packages are compatible
5. **Environment Variables**: Double-check all required variables are set

## Quick Fixes

### If the app shows a blank page:
1. Check browser console for errors
2. Verify environment variables are set
3. Check if Supabase is accessible
4. Ensure all dependencies are installed

### If build fails:
1. Check Node.js version (use 18.x)
2. Clear node_modules and reinstall
3. Check for TypeScript errors
4. Verify all imports are correct

### If routing doesn't work:
1. Verify vercel.json configuration
2. Check that all routes are properly defined
3. Ensure index.html is being served correctly
