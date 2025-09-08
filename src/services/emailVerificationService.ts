/**
 * Email Verification Service
 * Handles email verification, confirmation, and related email operations
 */

import { supabase } from '../integrations/supabase/client';
import { BaseService } from './baseService';
import { ServiceResponse } from '../types/api.types';

export interface EmailVerificationData {
  email: string;
  type: 'signup' | 'password_reset' | 'email_change' | 'invitation';
  redirectTo?: string;
  metadata?: Record<string, any>;
}

export interface EmailVerificationResult {
  success: boolean;
  emailSent: boolean;
  verificationToken?: string;
  expiresAt?: Date;
  error?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailVerificationService extends BaseService {
  /**
   * Send email verification
   */
  static async sendVerificationEmail(data: EmailVerificationData): Promise<ServiceResponse<EmailVerificationResult>> {
    try {
      // Validate input
      if (!data.email || !data.type) {
        return {
          success: false,
          error: 'Email and type are required',
          data: null
        };
      }

      // Check if user exists by looking in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', data.email)
        .single();
      
      if (profileError || !profile) {
        return {
          success: false,
          error: 'User not found',
          data: null
        };
      }

      // Send verification email based on type
      let result: EmailVerificationResult;

      switch (data.type) {
        case 'signup':
          result = await this.sendSignupVerification(data);
          break;
        case 'password_reset':
          result = await this.sendPasswordResetEmail(data);
          break;
        case 'email_change':
          result = await this.sendEmailChangeVerification(data);
          break;
        case 'invitation':
          result = await this.sendInvitationEmail(data);
          break;
        default:
          return {
            success: false,
            error: 'Invalid verification type',
            data: null
          };
      }

      return {
        success: result.success,
        data: result,
        error: result.error || null
      };

    } catch (error) {
      return this.handleError(error, 'EmailVerificationService.sendVerificationEmail');
    }
  }

  /**
   * Send signup verification email
   */
  private static async sendSignupVerification(data: EmailVerificationData): Promise<EmailVerificationResult> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: data.email,
        options: {
          emailRedirectTo: data.redirectTo || `${window.location.origin}/verify-email`
        }
      });

      if (error) {
        return {
          success: false,
          emailSent: false,
          error: error.message
        };
      }

      return {
        success: true,
        emailSent: true
      };

    } catch (error) {
      return {
        success: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send password reset email
   */
  private static async sendPasswordResetEmail(data: EmailVerificationData): Promise<EmailVerificationResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: data.redirectTo || `${window.location.origin}/reset-password`
      });

      if (error) {
        return {
          success: false,
          emailSent: false,
          error: error.message
        };
      }

      return {
        success: true,
        emailSent: true
      };

    } catch (error) {
      return {
        success: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email change verification
   */
  private static async sendEmailChangeVerification(data: EmailVerificationData): Promise<EmailVerificationResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email
      });

      if (error) {
        return {
          success: false,
          emailSent: false,
          error: error.message
        };
      }

      return {
        success: true,
        emailSent: true
      };

    } catch (error) {
      return {
        success: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send invitation email
   */
  private static async sendInvitationEmail(data: EmailVerificationData): Promise<EmailVerificationResult> {
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(data.email, {
        data: data.metadata || {},
        redirectTo: data.redirectTo || `${window.location.origin}/accept-invitation`
      });

      if (error) {
        return {
          success: false,
          emailSent: false,
          error: error.message
        };
      }

      return {
        success: true,
        emailSent: true
      };

    } catch (error) {
      return {
        success: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify email token
   */
  static async verifyEmailToken(token: string, type: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any
      });

      if (error) {
        return this.handleError(error, 'EmailVerificationService.verifyEmailToken');
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EmailVerificationService.verifyEmailToken');
    }
  }

  /**
   * Check email verification status
   */
  static async checkVerificationStatus(email: string): Promise<ServiceResponse<any>> {
    try {
      const { data: user, error } = await supabase.auth.admin.getUserByEmail(email);
      
      if (error) {
        return this.handleError(error, 'EmailVerificationService.checkVerificationStatus');
      }

      if (!user.user) {
        return {
          success: false,
          error: 'User not found',
          data: null
        };
      }

      const status = {
        email: user.user.email,
        emailConfirmed: user.user.email_confirmed_at !== null,
        emailConfirmedAt: user.user.email_confirmed_at,
        lastSignIn: user.user.last_sign_in_at,
        createdAt: user.user.created_at
      };

      return {
        success: true,
        data: status,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EmailVerificationService.checkVerificationStatus');
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) {
        return this.handleError(error, 'EmailVerificationService.resendVerificationEmail');
      }

      return {
        success: true,
        data: true,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EmailVerificationService.resendVerificationEmail');
    }
  }

  /**
   * Generate email template
   */
  static generateEmailTemplate(type: string, data: any): EmailTemplate {
    const baseUrl = window.location.origin;
    
    switch (type) {
      case 'signup':
        return {
          subject: 'Verify your email address - Crux',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to Crux!</h2>
              <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
              <a href="${data.verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${data.verificationLink}</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          `,
          text: `Welcome to Crux! Please verify your email address by visiting: ${data.verificationLink}`
        };

      case 'password_reset':
        return {
          subject: 'Reset your password - Crux',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>You requested to reset your password. Click the link below to set a new password:</p>
              <a href="${data.resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              <p>If you didn't request this, please ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          `,
          text: `Reset your password by visiting: ${data.resetLink}`
        };

      case 'invitation':
        return {
          subject: `You're invited to join ${data.tenantName} - Crux`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're Invited!</h2>
              <p>You've been invited to join <strong>${data.tenantName}</strong> on Crux.</p>
              <p>Your role: <strong>${data.role}</strong></p>
              <p>Click the link below to accept your invitation and create your account:</p>
              <a href="${data.invitationLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${data.invitationLink}</p>
              <p>This invitation will expire in 7 days.</p>
            </div>
          `,
          text: `You're invited to join ${data.tenantName}! Accept your invitation: ${data.invitationLink}`
        };

      default:
        return {
          subject: 'Email from Crux',
          html: '<p>Email content</p>',
          text: 'Email content'
        };
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email domain
   */
  static getEmailDomain(email: string): string | null {
    if (!this.validateEmail(email)) {
      return null;
    }
    return email.split('@')[1];
  }

  /**
   * Check if email domain is allowed
   */
  static async isEmailDomainAllowed(email: string): Promise<ServiceResponse<boolean>> {
    try {
      const domain = this.getEmailDomain(email);
      if (!domain) {
        return {
          success: false,
          error: 'Invalid email format',
          data: null
        };
      }

      // Check against blocked domains
      const { data: blockedDomains } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'blocked_email_domains')
        .single();

      if (blockedDomains?.value) {
        const blocked = blockedDomains.value as string[];
        const isBlocked = blocked.includes(domain);
        
        return {
          success: true,
          data: !isBlocked,
          error: null
        };
      }

      return {
        success: true,
        data: true,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EmailVerificationService.isEmailDomainAllowed');
    }
  }

  /**
   * Get email verification statistics
   */
  static async getVerificationStats(): Promise<ServiceResponse<any>> {
    try {
      // This would typically query your database for verification stats
      // For now, return basic stats
      const stats = {
        totalVerifications: 0,
        pendingVerifications: 0,
        failedVerifications: 0,
        successRate: 0
      };

      return {
        success: true,
        data: stats,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EmailVerificationService.getVerificationStats');
    }
  }
}
