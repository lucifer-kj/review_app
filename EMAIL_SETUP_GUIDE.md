# 📧 Email Review System Setup Guide

## 🎯 Overview
This guide will help you set up the complete email review system with embedded forms and conditional redirect logic.

## ✅ What's Been Implemented

### 1. **Embedded Email Form**
- ✅ Complete review form embedded directly in emails
- ✅ Interactive star rating system
- ✅ Form validation and submission
- ✅ Conditional Google review redirect (4+ stars)
- ✅ Responsive design for mobile/desktop

### 2. **Supabase Functions**
- ✅ `send-review-email` - Sends emails with embedded forms
- ✅ `submit-review` - Handles form submissions from emails
- ✅ Proper error handling and validation
- ✅ Database integration

### 3. **Frontend Integration**
- ✅ Updated email dialog with better feedback
- ✅ Test email functionality
- ✅ Dashboard integration

## 🔧 Setup Instructions

### Step 1: Configure Resend API Key

1. **Sign up for Resend**: Go to [resend.com](https://resend.com) and create an account
2. **Get API Key**: 
   - Go to your Resend dashboard
   - Navigate to "API Keys"
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Add to Supabase Environment**:
   - Go to your Supabase project dashboard
   - Navigate to "Settings" → "Edge Functions"
   - Add environment variable:
     - **Name**: `RESEND_API_KEY`
     - **Value**: Your Resend API key

### Step 2: Deploy Supabase Functions

1. **Deploy the functions**:
   ```bash
   # Deploy send-review-email function
   supabase functions deploy send-review-email
   
   # Deploy submit-review function
   supabase functions deploy submit-review
   ```

2. **Verify deployment**:
   - Check Supabase dashboard → Edge Functions
   - Both functions should show as "Active"

### Step 3: Test the System

1. **Test Email Sending**:
   - Go to your dashboard
   - Click "Test Email" button
   - Enter your email address
   - Check your email for the embedded form

2. **Test Form Submission**:
   - Open the email in your email client
   - Fill out the embedded form
   - Submit and verify it saves to your database

## 🎨 Features

### **Embedded Form Features**
- **Name Field**: Required text input
- **Phone Field**: Required phone number input
- **Star Rating**: Interactive 1-5 star rating
- **Form Validation**: Client-side validation
- **Success Message**: Shows after successful submission
- **Google Review Redirect**: Appears for 4+ star ratings

### **Email Features**
- **Responsive Design**: Works on mobile and desktop
- **Professional Styling**: Clean, modern design
- **Tracking**: Each email has unique tracking ID
- **Error Handling**: Graceful error messages

### **Database Integration**
- **Automatic Saving**: Reviews saved to Supabase database
- **Metadata Tracking**: Includes source, tracking ID, manager name
- **Rating Logic**: Automatically sets `google_review` flag for 4+ ratings

## 🔍 How It Works

### **Email Flow**
1. User clicks "Send Review Request" in dashboard
2. System generates unique tracking ID
3. Email sent with embedded HTML form
4. Recipient receives email with interactive form
5. Form submission goes to Supabase function
6. Review saved to database
7. Success message shown in email
8. Google review option appears for high ratings

### **Form Submission Flow**
1. User fills out form in email
2. JavaScript validates form data
3. Form submits to `submit-review` function
4. Function validates and saves to database
5. Success response sent back
6. UI updates to show success message
7. Google review option appears if rating ≥ 4

## 🐛 Troubleshooting

### **Email Not Sending**
- ✅ Check Resend API key is set correctly
- ✅ Verify Supabase function is deployed
- ✅ Check function logs in Supabase dashboard
- ✅ Ensure email address is valid

### **Form Not Submitting**
- ✅ Check `submit-review` function is deployed
- ✅ Verify database permissions
- ✅ Check browser console for errors
- ✅ Ensure all required fields are filled

### **Database Issues**
- ✅ Check Supabase connection
- ✅ Verify table permissions
- ✅ Check function logs for database errors

## 📊 Monitoring

### **Check Function Logs**
1. Go to Supabase dashboard
2. Navigate to "Edge Functions"
3. Click on function name
4. View logs for debugging

### **Database Monitoring**
1. Go to Supabase dashboard
2. Navigate to "Table Editor"
3. Check `reviews` table for new entries
4. Verify metadata fields are populated

## 🚀 Production Considerations

### **Email Deliverability**
- Use a verified domain with Resend
- Set up SPF/DKIM records
- Monitor bounce rates
- Use proper "from" addresses

### **Security**
- Validate all form inputs
- Use rate limiting
- Monitor for spam/abuse
- Regular security updates

### **Performance**
- Monitor function execution times
- Optimize database queries
- Use caching where appropriate
- Monitor email delivery rates

## 📝 Customization

### **Email Template**
- Edit HTML in `send-review-email/index.ts`
- Customize styling and layout
- Add your branding
- Modify form fields as needed

### **Form Validation**
- Update validation rules in `submit-review/index.ts`
- Add custom validation logic
- Modify error messages
- Add additional fields

### **Database Schema**
- Add new fields to `reviews` table
- Update metadata structure
- Add indexes for performance
- Modify constraints as needed

## 🎉 Success!

Once set up, your email review system will:
- ✅ Send professional emails with embedded forms
- ✅ Allow customers to review directly in their email
- ✅ Automatically save reviews to your database
- ✅ Show Google review options for high ratings
- ✅ Provide tracking and analytics
- ✅ Work seamlessly on mobile and desktop

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Supabase function logs
3. Verify your Resend API key configuration
4. Test with the built-in test functionality

---

**Happy reviewing! 🎉**
