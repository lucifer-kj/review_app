@echo off
REM Deploy Edge Functions for Multi-Tenant Public Review URL System
REM This script deploys the Edge Functions to Supabase

echo 🚀 Deploying Edge Functions for Multi-Tenant Public Review URL System...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI is not installed. Please install it first:
    echo    npm install -g supabase
    exit /b 1
)

REM Check if we're in a Supabase project
if not exist "supabase\config.toml" (
    echo ❌ Not in a Supabase project directory. Please run this from the project root.
    exit /b 1
)

REM Check if environment variables are set
if "%SUPABASE_URL%"=="" (
    echo ❌ SUPABASE_URL environment variable not set
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set
    exit /b 1
)

REM Set default BASE_DOMAIN if not provided
if "%BASE_DOMAIN%"=="" (
    set BASE_DOMAIN=https://yourapp.com
    echo ⚠️  BASE_DOMAIN not set, using default: %BASE_DOMAIN%
)

echo 📋 Configuration:
echo    - Supabase URL: %SUPABASE_URL%
echo    - Base Domain: %BASE_DOMAIN%
echo.

REM Extract project ref from SUPABASE_URL
for /f "tokens=2 delims=." %%a in ("%SUPABASE_URL%") do set PROJECT_REF=%%a

REM Deploy generate-review-url function
echo 🔧 Deploying generate-review-url function...
supabase functions deploy generate-review-url --project-ref %PROJECT_REF% --no-verify-jwt

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to deploy generate-review-url function
    exit /b 1
)
echo ✅ generate-review-url function deployed successfully

REM Deploy submit-public-review function
echo 🔧 Deploying submit-public-review function...
supabase functions deploy submit-public-review --project-ref %PROJECT_REF% --no-verify-jwt

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to deploy submit-public-review function
    exit /b 1
)
echo ✅ submit-public-review function deployed successfully

REM Set environment variables for the functions
echo 🔧 Setting environment variables...

REM Set BASE_DOMAIN for both functions
supabase secrets set BASE_DOMAIN="%BASE_DOMAIN%" --project-ref %PROJECT_REF%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to set BASE_DOMAIN environment variable
    exit /b 1
)
echo ✅ BASE_DOMAIN environment variable set

REM Set SUPABASE_SERVICE_ROLE_KEY for generate-review-url function
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="%SUPABASE_SERVICE_ROLE_KEY%" --project-ref %PROJECT_REF%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to set SUPABASE_SERVICE_ROLE_KEY environment variable
    exit /b 1
)
echo ✅ SUPABASE_SERVICE_ROLE_KEY environment variable set

echo.
echo 🎉 Edge Functions deployment completed successfully!
echo.
echo 📝 Next steps:
echo    1. Apply the database migration: supabase db push
echo    2. Test the functions using the Supabase dashboard
echo    3. Update your frontend to use the new public review system
echo.
echo 🔗 Function URLs:
echo    - Generate Review URL: %SUPABASE_URL%/functions/v1/generate-review-url
echo    - Submit Public Review: %SUPABASE_URL%/functions/v1/submit-public-review
echo.
echo ⚠️  Remember to:
echo    - Test the functions thoroughly before going live
echo    - Monitor function logs for any issues
echo    - Update your frontend environment variables

pause
