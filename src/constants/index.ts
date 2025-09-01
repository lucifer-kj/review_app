// App Configuration
export const APP_CONFIG = {
  NAME: "Alpha Business Designs",
  SHORT_NAME: "Alpha Dashboard",
  DESCRIPTION: "Alpha Business Designs Dashboard - Manage reviews and invoices",
  SUPPORT_EMAIL: "help@alphabusiness.com",
  GOOGLE_REVIEWS_URL: "https://g.page/r/CZEmfT3kD-k-EBM/review",
} as const;

// Routes
export const ROUTES = {
  DASHBOARD: "/",
  LOGIN: "/login",
  REVIEW: "/review",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD_REVIEWS: "/reviews",
  DASHBOARD_INVOICES: "/invoices",
} as const;

// Share Configuration
export const SHARE_CONFIG = {
  TITLE: "Alpha Business Designs - Share Your Experience",
  DESCRIPTION: "We'd love to hear about your experience with Alpha Business Designs. Please share your feedback!",
} as const;

// Form Validation
export const VALIDATION = {
  PHONE_REGEX: /^\d{8,15}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 15,
} as const;

// UI Constants
export const UI = {
  SKELETON_COUNT: 5,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 200,
} as const;

// Database Constants
export const DB = {
  TABLES: {
    REVIEWS: 'reviews',
    INVOICES: 'invoices',
    PROFILES: 'profiles',
  },
  STATUS: {
    DRAFT: 'draft',
    SENT: 'sent',
    PAID: 'paid',
    OVERDUE: 'overdue',
  },
} as const;

// Rating Constants
export const RATING = {
  MIN: 1,
  MAX: 5,
  HIGH_THRESHOLD: 4,
} as const;

// Currency
export const CURRENCY = {
  DEFAULT: 'USD',
  SYMBOL: '$',
} as const;
