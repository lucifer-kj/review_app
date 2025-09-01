# Review Email Flow Test Guide

## 🧪 Testing the Complete Email-to-Review Flow

### Prerequisites
1. Ensure your Supabase project is running
2. Deploy the new `send-review-email` function:
   ```bash
   supabase functions deploy send-review-email
   ```
3. Set up your Resend API key in Supabase environment variables
4. Set up your frontend URL in Supabase environment variables

### Test Steps

#### 1. Test Dashboard Email Sending
1. Navigate to `/reviews` in your dashboard
2. Click "Send Review Request" button
3. Fill in the form:
   - Customer Name: "John Doe"
   - Customer Email: "test@example.com"
   - Manager Name: "Your Name" (optional)
   - Business Name: "Alpha Business Designs"
4. Click "Send Review Request"
5. Verify success message appears

#### 2. Test Email Content
1. Check the email was sent to the test email address
2. Verify email contains:
   - Professional HTML formatting
   - Customer's name in greeting
   - "Leave a Review" button
   - Proper branding and styling

#### 3. Test Review Form Page
1. Click the "Leave a Review" button in the email
2. Verify it opens `/review-form` with:
   - Pre-filled customer name (if provided in URL)
   - Email source indicator
   - All form fields working
   - Star rating component functional

#### 4. Test High Rating Flow (4-5 stars)
1. Fill out the review form with:
   - Name: "John Doe"
   - Phone: "1234567890"
   - Rating: 4 or 5 stars
2. Submit the form
3. Verify:
   - Google Reviews page opens in new tab
   - Redirects to `/review/thank-you` page
   - Thank you page shows correct rating
   - "Leave Google Review" button works

#### 5. Test Low Rating Flow (1-3 stars)
1. Fill out the review form with:
   - Name: "Jane Smith"
   - Phone: "0987654321"
   - Rating: 1, 2, or 3 stars
2. Submit the form
3. Verify:
   - Redirects to `/review/feedback` page
   - Feedback form is displayed
   - Can submit feedback
   - Redirects to `/review/feedback-thank-you` after submission

#### 6. Test Database Storage
1. Check your Supabase `reviews` table
2. Verify new reviews are stored with:
   - Correct customer information
   - Rating and metadata
   - `google_review` flag set correctly
   - `source` field set to "email_form"
   - Tracking information preserved

#### 7. Test URL Parameters
1. Test with different URL parameters:
   - `?utm_source=email&utm_campaign=review_request&tracking_id=123&customer=John%20Doe`
2. Verify parameters are preserved in database metadata

### Expected Results

✅ **Email Sending**: Success message in dashboard
✅ **Email Content**: Professional, branded email with working button
✅ **Form Navigation**: Smooth transitions between pages
✅ **High Rating Flow**: Google Reviews redirect + thank you page
✅ **Low Rating Flow**: Feedback collection + thank you page
✅ **Database Storage**: All data properly stored with metadata
✅ **URL Parameters**: Tracking information preserved

### Troubleshooting

#### Email Not Sending
- Check Resend API key is set in Supabase
- Verify function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs send-review-email`

#### Form Not Working
- Check browser console for errors
- Verify all routes are properly configured in App.tsx
- Test individual components in isolation

#### Database Issues
- Check RLS policies allow inserts
- Verify table schema matches expectations
- Check Supabase logs for errors

### Performance Notes
- Email sending should complete within 2-3 seconds
- Form submissions should be instant
- Page transitions should be smooth with loading states

### Security Considerations
- Email addresses are validated before sending
- All user inputs are sanitized
- CORS headers are properly configured
- Rate limiting should be implemented in production
