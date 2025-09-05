# Crux - Review Management System

**Powered by Alpha Business Digital**

Crux is a modern, responsive review management dashboard built with React, TypeScript, and Supabase. It provides professional-grade tools for businesses to collect, manage, and analyze customer feedback.

## Features

- 📊 **Dashboard Analytics**: Track review statistics and business metrics
- 📧 **Email Review Requests**: Generate personalized email templates for customer review requests
- 📱 **Mobile Responsive**: Optimized for both desktop and mobile devices
- 🔐 **Secure Authentication**: Built-in user authentication and authorization
- 📈 **Review Management**: View, manage, and analyze customer reviews
- ⚡ **Real-time Updates**: Live data updates with Supabase real-time subscriptions

## Email System

This application uses a **browser-based email client integration** for sending review requests:

### How It Works

1. **Generate Email Template**: Create personalized email content with customer details
2. **Multiple Sending Options**:
   - **Open Email Client**: Automatically opens your default email client with pre-filled content
   - **Copy to Clipboard**: Copy the email content to paste into any email service
3. **No Third-party Dependencies**: Uses your own email account and client

### Benefits

- ✅ **No API Keys Required**: No need for Resend, SendGrid, or other email services
- ✅ **Uses Your Email**: Sends from your registered business email address
- ✅ **Privacy Focused**: No third-party email service involved
- ✅ **Simple Setup**: Works with any email client (Gmail, Outlook, Apple Mail, etc.)
- ✅ **Cost Effective**: No monthly email service fees

## Quick Start

### Prerequisites

- Node.js 18+ 
- Bun (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alpha-pro02-main
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_FRONTEND_URL=https://yourdomain.com
   ```

4. **Run the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_FRONTEND_URL` | Your frontend URL for email links | Yes |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | No |
| `VITE_GA_TRACKING_ID` | Google Analytics tracking ID | No |

## Database Schema

The application uses the following Supabase tables:

### `reviews`
- `id` (UUID, Primary Key)
- `name` (Text)
- `email` (Text)
- `phone` (Text)
- `rating` (Integer)
- `feedback` (Text)
- `created_at` (Timestamp)

### `business_settings`
- `id` (UUID, Primary Key)
- `business_name` (Text)
- `business_email` (Text)
- `business_phone` (Text)
- `business_address` (Text)
- `google_business_url` (Text)

## Email Template Features

The email system generates professional review request emails with:

- Personalized customer greeting
- Business branding and contact information
- Direct link to review form
- UTM tracking parameters
- Mobile-responsive design
- Professional formatting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@alphabusiness.com or create an issue in the repository.
