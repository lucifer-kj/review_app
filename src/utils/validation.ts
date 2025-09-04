import { z } from "zod";
import { VALIDATION } from "@/constants";

// Review validation schema
export const reviewSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(VALIDATION.MAX_NAME_LENGTH, `Name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters`)
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  phone: z.string()
    .min(7, "Phone number must be at least 7 digits")
    .max(VALIDATION.MAX_PHONE_LENGTH, `Phone number must be less than ${VALIDATION.MAX_PHONE_LENGTH} digits`)
    .regex(VALIDATION.PHONE_REGEX, "Phone number must contain only digits"),
  countryCode: z.string()
    .regex(/^\+\d{1,4}$/, "Invalid country code format"),
  rating: z.number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .int("Rating must be a whole number"),
});



// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(VALIDATION.PHONE_REGEX, "Invalid phone number").optional(),
  password: z.string()
    .min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(VALIDATION.PHONE_REGEX, "Invalid phone number").optional(),
  password: z.string()
    .min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`)
    .max(100, "Password must be less than 100 characters"),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

// Type exports
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

// Validation helper functions with better type safety
export const validateReview = (data: unknown): ValidationResult<ReviewFormData> => {
  const result = reviewSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.flatten().fieldErrors as Record<string, string>
  };
};



export const validateLogin = (data: unknown): ValidationResult<LoginFormData> => {
  const result = loginSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.flatten().fieldErrors as Record<string, string>
  };
};

export const validateSignup = (data: unknown): ValidationResult<SignupFormData> => {
  const result = signupSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.flatten().fieldErrors as Record<string, string>
  };
};

// Utility functions for common validations
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return VALIDATION.PHONE_REGEX.test(phone);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION.MIN_PASSWORD_LENGTH;
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};
