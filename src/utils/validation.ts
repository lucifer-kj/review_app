import { VALIDATION } from '@/constants';

// Input sanitization utilities
export class InputSanitizer {
  /**
   * Sanitize text input to prevent XSS and injection attacks
   */
  static sanitizeText(input: string | null | undefined): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(input: string | null | undefined): string {
    if (!input) return '';
    
    const sanitized = this.sanitizeText(input);
    return sanitized.toLowerCase();
  }

  /**
   * Sanitize phone number input
   */
  static sanitizePhone(input: string | null | undefined): string {
    if (!input) return '';
    
    // Remove all non-digit characters except + at the beginning
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // Ensure it starts with + if it has country code
    if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(input: string | null | undefined): string {
    if (!input) return '';
    
    const sanitized = this.sanitizeText(input);
    
    // Basic URL validation
    try {
      const url = new URL(sanitized);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '';
      }
      return url.toString();
    } catch {
      return '';
    }
  }
}

// Validation utilities
export class InputValidator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email address is too long' };
    }

    return { isValid: true };
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string, countryCode: string = '+1'): { isValid: boolean; error?: string } {
    if (!phone) {
      return { isValid: false, error: 'Phone number is required' };
    }

    const cleaned = phone.replace(/\D/g, '');
    
    if (!VALIDATION.PHONE_REGEX.test(cleaned)) {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }

    if (cleaned.length < 7 || cleaned.length > 15) {
      return { isValid: false, error: 'Phone number must be between 7 and 15 digits' };
    }

    return { isValid: true };
  }

  /**
   * Validate name format
   */
  static validateName(name: string): { isValid: boolean; error?: string } {
    if (!name) {
      return { isValid: false, error: 'Name is required' };
    }

    if (name.length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long' };
    }

    if (name.length > VALIDATION.MAX_NAME_LENGTH) {
      return { isValid: false, error: `Name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters` };
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    return { isValid: true };
  }

  /**
   * Validate rating value
   */
  static validateRating(rating: number): { isValid: boolean; error?: string } {
    if (typeof rating !== 'number' || isNaN(rating)) {
      return { isValid: false, error: 'Rating must be a number' };
    }

    if (rating < 1 || rating > 5) {
      return { isValid: false, error: 'Rating must be between 1 and 5' };
    }

    if (!Number.isInteger(rating)) {
      return { isValid: false, error: 'Rating must be a whole number' };
    }

    return { isValid: true };
  }
}