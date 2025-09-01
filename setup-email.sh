#!/bin/bash

# Email Setup Script for Alpha Business Designs
# This script helps you set up the Resend API key for email functionality

echo "🚀 Alpha Business Designs - Email Setup"
echo "========================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Get Resend API key from user
echo "📧 Resend API Key Setup"
echo "======================="
echo ""
echo "1. Go to https://resend.com and sign up/login"
echo "2. Navigate to API Keys in your dashboard"
echo "3. Create a new API key"
echo "4. Copy the key (starts with 're_')"
echo ""

read -p "Enter your Resend API key: " RESEND_API_KEY

if [ -z "$RESEND_API_KEY" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

if [[ ! $RESEND_API_KEY =~ ^re_ ]]; then
    echo "⚠️  Warning: Resend API keys usually start with 're_'. Please verify your key."
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

echo ""
echo "🔧 Setting up environment variables..."

# Set the environment variable in Supabase
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"

if [ $? -eq 0 ]; then
    echo "✅ RESEND_API_KEY environment variable set successfully!"
else
    echo "❌ Failed to set environment variable. Please check your Supabase CLI configuration."
    exit 1
fi

echo ""
echo "🚀 Deploying email functions..."

# Deploy the email functions
supabase functions deploy send-review-email
if [ $? -eq 0 ]; then
    echo "✅ send-review-email function deployed successfully!"
else
    echo "❌ Failed to deploy send-review-email function"
    exit 1
fi

supabase functions deploy submit-review
if [ $? -eq 0 ]; then
    echo "✅ submit-review function deployed successfully!"
else
    echo "❌ Failed to deploy submit-review function"
    exit 1
fi

supabase functions deploy send-invoice-email
if [ $? -eq 0 ]; then
    echo "✅ send-invoice-email function deployed successfully!"
else
    echo "❌ Failed to deploy send-invoice-email function"
    exit 1
fi

echo ""
echo "🎉 Email setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your dashboard"
echo "2. Click 'Test Email' to verify the setup"
echo "3. Enter your email address to test"
echo "4. Check your email for the embedded review form"
echo ""
echo "📚 For more information, see EMAIL_SETUP_GUIDE.md"
echo ""
echo "Happy emailing! 📧✨"
