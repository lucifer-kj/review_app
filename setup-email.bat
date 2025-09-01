@echo off
setlocal enabledelayedexpansion

REM Email Setup Script for Alpha Business Designs (Windows)
REM This script helps you set up the Resend API key for email functionality

echo 🚀 Alpha Business Designs - Email Setup
echo ========================================
echo.

REM Check if Supabase CLI is installed
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Supabase CLI is not installed.
    echo Please install it first: https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)

echo ✅ Supabase CLI found
echo.

REM Get Resend API key from user
echo 📧 Resend API Key Setup
echo =======================
echo.
echo 1. Go to https://resend.com and sign up/login
echo 2. Navigate to API Keys in your dashboard
echo 3. Create a new API key
echo 4. Copy the key (starts with 're_')
echo.

set /p RESEND_API_KEY="Enter your Resend API key: "

if "%RESEND_API_KEY%"=="" (
    echo ❌ No API key provided. Exiting.
    pause
    exit /b 1
)

echo %RESEND_API_KEY% | findstr /b "re_" >nul
if errorlevel 1 (
    echo ⚠️  Warning: Resend API keys usually start with 're_'. Please verify your key.
    set /p confirm="Continue anyway? (y/N): "
    if /i not "%confirm%"=="y" (
        echo ❌ Setup cancelled.
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Setting up environment variables...

REM Set the environment variable in Supabase
supabase secrets set RESEND_API_KEY=%RESEND_API_KEY%

if errorlevel 1 (
    echo ❌ Failed to set environment variable. Please check your Supabase CLI configuration.
    pause
    exit /b 1
) else (
    echo ✅ RESEND_API_KEY environment variable set successfully!
)

echo.
echo 🚀 Deploying email functions...

REM Deploy the email functions
supabase functions deploy send-review-email
if errorlevel 1 (
    echo ❌ Failed to deploy send-review-email function
    pause
    exit /b 1
) else (
    echo ✅ send-review-email function deployed successfully!
)

supabase functions deploy submit-review
if errorlevel 1 (
    echo ❌ Failed to deploy submit-review function
    pause
    exit /b 1
) else (
    echo ✅ submit-review function deployed successfully!
)

supabase functions deploy send-invoice-email
if errorlevel 1 (
    echo ❌ Failed to deploy send-invoice-email function
    pause
    exit /b 1
) else (
    echo ✅ send-invoice-email function deployed successfully!
)

echo.
echo 🎉 Email setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Go to your dashboard
echo 2. Click 'Test Email' to verify the setup
echo 3. Enter your email address to test
echo 4. Check your email for the embedded review form
echo.
echo 📚 For more information, see EMAIL_SETUP_GUIDE.md
echo.
echo Happy emailing! 📧✨
echo.
pause
