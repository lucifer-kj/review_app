# Email Template System Update

## Overview
The email template system has been completely updated to use dynamic business settings and generate professional HTML email templates with proper review links.

## Key Changes Made

### 1. **Dynamic Business Settings Integration**

#### New BusinessSettingsService (`src/services/businessSettingsService.ts`)
- **Purpose**: Manages business settings from the database
- **Key Features**:
  - Fetches business settings with fallback defaults
  - Handles upsert operations for creating/updating settings
  - Provides default values when no settings exist

#### Business Settings Fields Used:
- `business_name` - Company name in email signature
- `business_email` - Contact email in footer
- `business_phone` - Phone number in footer  
- `business_address` - Address in footer
- `google_business_url` - Google Business profile link

### 2. **Enhanced EmailService (`src/services/emailService.ts`)**

#### New Features:
- **Async Template Generation**: Now fetches business settings dynamically
- **HTML Email Templates**: Generates professional HTML emails with responsive design
- **Dynamic Content**: All placeholders replaced with actual business data
- **Proper Review Links**: Links point to `/review` form with UTM tracking

#### Email Template Improvements:
- **Responsive Design**: Works on all email clients and devices
- **Dark Mode Support**: Automatic dark mode detection
- **Professional Styling**: Clean, modern design with proper branding
- **Accessibility**: Proper alt text and semantic HTML

### 3. **Updated SendReviewEmailDialog (`src/components/SendReviewEmailDialog.tsx`)**

#### Enhanced Features:
- **HTML Preview**: Shows actual email appearance in iframe
- **Async Processing**: Handles dynamic template generation
- **Better UX**: Improved form layout and user feedback
- **Error Handling**: Proper error messages and fallbacks

### 4. **Email Template Structure**

#### Dynamic Elements:
```html
<!-- Business Name -->
The ${businessName} Team

<!-- Footer Contact Info -->
${businessName}${businessEmail ? ` | ${businessEmail}` : ''}${businessPhone ? ` | ${businessPhone}` : ''}${businessAddress ? ` | ${businessAddress}` : ''}

<!-- Review Link -->
<a href="${reviewUrl}" class="button">
  Submit Your Review ⭐
</a>
```

#### Review URL Structure:
```
/review?utm_source=email&utm_campaign=review_request&customer=${customerName}&tracking_id=${trackingId}
```

## Technical Implementation

### 1. **Database Integration**
- Uses existing `business_settings` table
- Fetches settings per user session
- Provides fallback defaults for missing data

### 2. **Email Generation Process**
1. User fills out customer details
2. System fetches business settings from database
3. Generates HTML email template with dynamic data
4. Creates both HTML and plain text versions
5. Shows preview in dialog
6. User can open email client or copy to clipboard

### 3. **Template Features**
- **Responsive**: Adapts to mobile and desktop
- **Cross-Platform**: Works in Gmail, Outlook, Apple Mail, etc.
- **Accessible**: Proper contrast and screen reader support
- **Branded**: Uses business colors and styling

## Benefits

### 1. **Professional Appearance**
- HTML emails look much more professional than plain text
- Consistent branding across all communications
- Better engagement rates

### 2. **Dynamic Content**
- No more manual placeholder replacement
- Always uses current business information
- Consistent messaging across all emails

### 3. **Better User Experience**
- Preview shows exactly what customer will see
- Easy to customize and send
- Professional email client integration

### 4. **Tracking & Analytics**
- UTM parameters for tracking email performance
- Customer-specific tracking IDs
- Campaign attribution

## Usage Instructions

### 1. **Setting Up Business Information**
1. Go to Settings page
2. Fill in business details:
   - Business Name
   - Business Email
   - Business Phone
   - Business Address
3. Save settings

### 2. **Sending Review Emails**
1. Click "Send Review Request" button
2. Enter customer details:
   - Customer Name
   - Customer Email
   - Manager Name (optional)
3. Click "Generate Email"
4. Preview the email
5. Choose to:
   - Open Email Client (opens default email app)
   - Copy to Clipboard (for manual sending)

### 3. **Email Template Features**
- **Responsive Design**: Works on all devices
- **Professional Styling**: Clean, modern appearance
- **Dynamic Content**: Uses your business information
- **Tracking Links**: Proper UTM parameters
- **Accessibility**: Screen reader friendly

## File Structure

```
src/
├── services/
│   ├── businessSettingsService.ts  # Business settings management
│   └── emailService.ts             # Email template generation
├── components/
│   └── SendReviewEmailDialog.tsx   # Email dialog component
└── types/
    └── index.ts                    # Type definitions
```

## Migration Notes

### From Static Template:
- ✅ Removed hardcoded placeholders
- ✅ Added dynamic business settings integration
- ✅ Enhanced with HTML email support
- ✅ Improved user experience
- ✅ Added proper tracking links

### Backward Compatibility:
- ✅ Plain text emails still supported
- ✅ Fallback defaults for missing settings
- ✅ Graceful error handling
- ✅ No breaking changes to existing functionality

## Future Enhancements

### Potential Improvements:
1. **Email Templates Library**: Multiple template designs
2. **Custom Branding**: Upload company logos
3. **Email Scheduling**: Send emails at specific times
4. **Analytics Dashboard**: Track email performance
5. **A/B Testing**: Test different email designs
6. **Automation**: Trigger emails based on events

## Testing

### Manual Testing Checklist:
- [ ] Business settings save correctly
- [ ] Email template generates with dynamic data
- [ ] HTML preview displays properly
- [ ] Email client opens with correct content
- [ ] Clipboard copy works
- [ ] Review links point to correct URL
- [ ] Responsive design works on mobile
- [ ] Dark mode support works

### Automated Testing:
- [ ] BusinessSettingsService unit tests
- [ ] EmailService template generation tests
- [ ] SendReviewEmailDialog component tests
- [ ] Integration tests for full flow

## Support

For issues or questions:
1. Check business settings are configured
2. Verify email client compatibility
3. Test with different email providers
4. Review console for error messages
5. Check network connectivity for settings fetch
