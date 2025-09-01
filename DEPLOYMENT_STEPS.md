# 🚀 Review Email System Deployment Steps

## Step 1: Deploy the Edge Function

### 1.1 Go to Supabase Dashboard
- Open: https://supabase.com/dashboard/project/elhbthnvwcqewjpwulhq
- Login if needed

### 1.2 Navigate to Edge Functions
- Click **"Edge Functions"** in the left sidebar
- Click **"Create a new function"**

### 1.3 Create the Function
- **Function name**: `send-review-email`
- Click **"Create function"**

### 1.4 Copy the Function Code
- Open the file `function-code-to-copy.ts` in this project
- Copy ALL the code from that file
- Paste it into the Supabase function editor
- Click **"Deploy"**

## Step 2: Set Environment Variables

### 2.1 Go to Settings
- In your Supabase Dashboard, go to **Settings** → **Edge Functions**

### 2.2 Add Environment Variables
Add these two environment variables:

**Variable 1:**
- **Name**: `RESEND_API_KEY`
- **Value**: `re_your_resend_api_key_here` (replace with your actual Resend API key)

**Variable 2:**
- **Name**: `FRONTEND_URL`
- **Value**: `https://invoice-ffn1bujwq-arifs-projects-8194d925.vercel.app`

### 2.3 Save Changes
- Click **"Save"** after adding both variables

## Step 3: Update CORS Settings

### 3.1 Go to API Settings
- In your Supabase Dashboard, go to **Settings** → **API**

### 3.2 Add CORS Origin
- Under **CORS**, add your frontend URL:
- **Origin**: `https://invoice-ffn1bujwq-arifs-projects-8194d925.vercel.app`
- Click **"Save"**

## Step 4: Test the Function

### 4.1 Test via Dashboard
- Go back to **Edge Functions**
- Click on your `send-review-email` function
- Click **"Invoke function"**
- Use this test payload:
```json
{
  "customerEmail": "test@example.com",
  "customerName": "Test User"
}
```

### 4.2 Test via Frontend
- Go to your deployed app: https://invoice-ffn1bujwq-arifs-projects-8194d925.vercel.app
- Login to dashboard
- Go to Reviews page
- Click "Send Review Request"
- Fill in the form and send

## Step 5: Verify Everything Works

### 5.1 Check Function Logs
- In Edge Functions, click on your function
- Check the **"Logs"** tab for any errors

### 5.2 Test Email Flow
- Send a test email from the dashboard
- Check if the email is received
- Click the "Leave a Review" button in the email
- Verify it opens your review form

## Troubleshooting

### If you get CORS errors:
- Make sure you added the frontend URL to CORS settings
- Check that the URL is exactly: `https://invoice-ffn1bujwq-arifs-projects-8194d925.vercel.app`

### If you get "Resend API key not configured":
- Make sure you set the `RESEND_API_KEY` environment variable
- Verify the API key is correct and starts with `re_`

### If emails don't send:
- Check the function logs for detailed error messages
- Verify your Resend API key has the correct permissions
- Make sure the sender email domain is verified in Resend

## Success Indicators

✅ Function deploys without errors
✅ Environment variables are set
✅ CORS settings include your frontend URL
✅ Test function call returns success
✅ Email is sent and received
✅ Review form opens when clicking email link
✅ Review submission works correctly
