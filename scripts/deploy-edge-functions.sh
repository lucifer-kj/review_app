#!/bin/bash

# Deploy Edge Functions for Multi-Tenant Public Review URL System
# This script deploys the Edge Functions to Supabase

set -e

echo "🚀 Deploying Edge Functions for Multi-Tenant Public Review URL System..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from the project root."
    exit 1
fi

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Required environment variables not set:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - BASE_DOMAIN (optional, defaults to https://yourapp.com)"
    exit 1
fi

# Set default BASE_DOMAIN if not provided
if [ -z "$BASE_DOMAIN" ]; then
    BASE_DOMAIN="https://yourapp.com"
    echo "⚠️  BASE_DOMAIN not set, using default: $BASE_DOMAIN"
fi

echo "📋 Configuration:"
echo "   - Supabase URL: $SUPABASE_URL"
echo "   - Base Domain: $BASE_DOMAIN"
echo ""

# Deploy generate-review-url function
echo "🔧 Deploying generate-review-url function..."
supabase functions deploy generate-review-url \
  --project-ref $(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/') \
  --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ generate-review-url function deployed successfully"
else
    echo "❌ Failed to deploy generate-review-url function"
    exit 1
fi

# Deploy submit-public-review function
echo "🔧 Deploying submit-public-review function..."
supabase functions deploy submit-public-review \
  --project-ref $(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/') \
  --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ submit-public-review function deployed successfully"
else
    echo "❌ Failed to deploy submit-public-review function"
    exit 1
fi

# Set environment variables for the functions
echo "🔧 Setting environment variables..."

# Set BASE_DOMAIN for both functions
supabase secrets set BASE_DOMAIN="$BASE_DOMAIN" \
  --project-ref $(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')

if [ $? -eq 0 ]; then
    echo "✅ BASE_DOMAIN environment variable set"
else
    echo "❌ Failed to set BASE_DOMAIN environment variable"
    exit 1
fi

# Set SUPABASE_SERVICE_ROLE_KEY for generate-review-url function
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --project-ref $(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')

if [ $? -eq 0 ]; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY environment variable set"
else
    echo "❌ Failed to set SUPABASE_SERVICE_ROLE_KEY environment variable"
    exit 1
fi

echo ""
echo "🎉 Edge Functions deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Apply the database migration: supabase db push"
echo "   2. Test the functions using the Supabase dashboard"
echo "   3. Update your frontend to use the new public review system"
echo ""
echo "🔗 Function URLs:"
echo "   - Generate Review URL: $SUPABASE_URL/functions/v1/generate-review-url"
echo "   - Submit Public Review: $SUPABASE_URL/functions/v1/submit-public-review"
echo ""
echo "⚠️  Remember to:"
echo "   - Test the functions thoroughly before going live"
echo "   - Monitor function logs for any issues"
echo "   - Update your frontend environment variables"
