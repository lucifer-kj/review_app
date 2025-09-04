// App Configuration
export const APP_CONFIG = {
  NAME: "Alpha Business Designs",
  SHORT_NAME: "Alpha Dashboard",
  DESCRIPTION: "Alpha Business Designs Dashboard - Manage customer reviews",
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
} as const;

// Share Configuration
export const SHARE_CONFIG = {
  TITLE: "Alpha Business Designs - Share Your Experience",
  DESCRIPTION: "We'd love to hear about your experience with Alpha Business Designs. Please share your feedback!",
} as const;

// Form Validation
export const VALIDATION = {
  PHONE_REGEX: /^\d{7,15}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 15,
} as const;

// Email Configuration
export const EMAIL_CONFIG = {
  DEFAULT_DOMAIN: "alphabusiness.com",
  DEFAULT_FROM_NAME: "noreply",
  SUBJECT_TEMPLATE: "We'd love your feedback, {customerName}!",
  TEMPLATES: {
    DEFAULT: "default",
    MINIMAL: "minimal",
    PROFESSIONAL: "professional",
  },
  COLORS: {
    PRIMARY: "oklch(0.55 0.15 240)",
    SECONDARY: "oklch(0.60 0.02 0)",
    SUCCESS: "oklch(0.75 0.15 142)",
    WARNING: "oklch(0.85 0.15 85)",
    DANGER: "oklch(0.65 0.20 25)",
  },
  BUTTON_TEXTS: {
    LEAVE_REVIEW: "Leave a Review",
    SHARE_FEEDBACK: "Share Feedback",
    RATE_US: "Rate Us",
  },
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60 * 1000, // 1 minute
    BLOCK_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  },
  // ✅ SECURE: Use environment-based origins instead of hardcoded values
  ALLOWED_ORIGINS: import.meta.env.VITE_ALLOWED_ORIGINS?.split(',') || [
    "http://localhost:3000",
    "http://localhost:5173",
  ],
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 1, // Linear backoff
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
    PROFILES: 'profiles',
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
