# Crux - Review Management System

**Powered by Alpha Business Digital**

Crux is a comprehensive, enterprise-grade review management platform built with modern technologies. It provides multi-tenant SaaS capabilities for businesses to collect, manage, and analyze customer feedback at scale.

## 🚀 Features

### Core Functionality
- 📊 **Master Dashboard**: Platform-wide analytics and tenant management
- 🏢 **Multi-Tenant Architecture**: Complete tenant isolation and management
- 👥 **User Management**: Role-based access control with invitation system
- 📧 **Email Integration**: Resend API with fallback options
- 🔐 **Enterprise Security**: Comprehensive audit logging and security monitoring
- 📈 **Real-time Analytics**: Live metrics with interactive charts
- ⚡ **Performance Monitoring**: Real-time performance tracking and optimization

### Advanced Features
- 🛡️ **Security Audit System**: Automated security checks and compliance
- 📊 **Performance Dashboard**: System health and performance metrics
- 🔄 **Backup & Recovery**: Automated backup system with disaster recovery
- 📋 **Audit Logging**: Comprehensive activity tracking and compliance
- 🎯 **Role-Based Access**: Super Admin, Tenant Admin, and User roles
- 📱 **Mobile Responsive**: Optimized for all devices

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18.3.1 + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build**: Vite with SWC, managed with Bun

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   External      │
│   (React)       │◄──►│   Backend       │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Master Dash   │    │ • PostgreSQL    │    │ • Resend API    │
│ • Tenant Dash   │    │ • Auth          │    │ • File Storage  │
│ • Review Forms  │    │ • Edge Functions│    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

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
