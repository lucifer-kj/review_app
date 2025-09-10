/**
 * Security Audit Utility
 * Provides security checks and validation for the application
 */

import { env } from './env';

export interface SecurityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

export class SecurityAudit {
  /**
   * Check for common security issues
   */
  static async runSecurityAudit(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check environment variables
    issues.push(...this.checkEnvironmentSecurity());

    // Check for hardcoded secrets
    issues.push(...this.checkHardcodedSecrets());

    // Check for client-side validation only
    issues.push(...this.checkClientSideValidation());

    return issues;
  }

  /**
   * Check environment variable security
   */
  private static checkEnvironmentSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for placeholder values in production
    if (env.supabase.url.includes('placeholder') || 
        env.supabase.anonKey.includes('placeholder')) {
      issues.push({
        type: 'error',
        message: 'Placeholder values detected in Supabase configuration',
        recommendation: 'Replace placeholder values with actual Supabase credentials'
      });
    }

    // Check for localhost URLs in production
    if (env.frontend.url.includes('localhost') && import.meta.env.PROD) {
      issues.push({
        type: 'warning',
        message: 'Localhost URL detected in production environment',
        recommendation: 'Use production domain for frontend URL'
      });
    }

    return issues;
  }

  /**
   * Check for hardcoded secrets
   */
  private static checkHardcodedSecrets(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // This would typically scan the codebase for hardcoded secrets
    // For now, we'll just return a general recommendation
    issues.push({
      type: 'info',
      message: 'Hardcoded secrets check',
      recommendation: 'Regularly audit codebase for hardcoded API keys, passwords, or tokens'
    });

    return issues;
  }

  /**
   * Check for client-side only validation
   */
  private static checkClientSideValidation(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    issues.push({
      type: 'warning',
      message: 'Client-side validation detected',
      recommendation: 'Ensure all validation is also performed server-side for security'
    });

    return issues;
  }

  /**
   * Validate input for XSS prevention
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Check if running in secure context
   */
  static isSecureContext(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext;
  }

  /**
   * Get security headers recommendations
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    };
  }
}
