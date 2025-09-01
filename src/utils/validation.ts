import { z } from "zod";
import { VALIDATION } from "@/constants";

// Review validation schema
export const reviewSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(VALIDATION.MAX_NAME_LENGTH, `Name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters`)
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  phone: z.string()
    .min(8, "Phone number must be at least 8 digits")
    .max(VALIDATION.MAX_PHONE_LENGTH, `Phone number must be less than ${VALIDATION.MAX_PHONE_LENGTH} digits`)
    .regex(VALIDATION.PHONE_REGEX, "Phone number must contain only digits"),
  countryCode: z.string()
    .regex(/^\+\d{1,4}$/, "Invalid country code format"),
  rating: z.number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .int("Rating must be a whole number"),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  invoice_number: z.string()
    .min(1, "Invoice number is required")
    .max(50, "Invoice number must be less than 50 characters"),
  customer_name: z.string()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must be less than 100 characters"),
  customer_email: z.string()
    .email("Invalid email address"),
  customer_address: z.string().optional(),
  customer_phone: z.string().optional(),
  item_description: z.string()
    .min(1, "Item description is required")
    .max(500, "Item description must be less than 500 characters"),
  quantity: z.number()
    .min(0.01, "Quantity must be greater than 0")
    .max(999999, "Quantity is too large"),
  unit_price: z.number()
    .min(0, "Unit price must be non-negative")
    .max(999999, "Unit price is too large"),
  total: z.number()
    .min(0, "Total must be non-negative")
    .max(999999, "Total is too large"),
  currency: z.string()
    .length(3, "Currency must be a 3-letter code"),
  due_date: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
  notes: z.string().optional(),
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
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Validation helper functions
export const validateReview = (data: unknown) => {
  return reviewSchema.safeParse(data);
};

export const validateInvoice = (data: unknown) => {
  return invoiceSchema.safeParse(data);
};

export const validateLogin = (data: unknown) => {
  return loginSchema.safeParse(data);
};

export const validateSignup = (data: unknown) => {
  return signupSchema.safeParse(data);
};
