import { BusinessSettingsService, type BusinessSettings } from './businessSettingsService';
import { logger } from '@/utils/logger';

export interface EmailTemplateData {
  customerEmail: string;
  customerName: string;
  businessName: string;
  managerName?: string;
  trackingId?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface EmailSendingResult {
  success: boolean;
  message: string;
  error?: string;
}

export class UnifiedEmailService {
  private static emailjsUserId: string;
  private static emailjsServiceId: string;
  private static emailjsTemplateId: string;
  private static resendApiKey: string;

  /**
   * Initialize email service configuration
   */
  static initialize(): void {
    this.emailjsUserId = import.meta.env.VITE_EMAILJS_USER_ID || '';
    this.emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    this.emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    this.resendApiKey = import.meta.env.VITE_RESEND_API_KEY || '';
  }

  /**
   * Generate a review email template with all necessary information
   */
  static async generateReviewEmailTemplate(data: EmailTemplateData): Promise<EmailData> {
    const {
      customerEmail,
      customerName,
      businessName,
      managerName,
      trackingId
    } = data;

    try {
      // Get business settings with defaults
      const businessSettings = await BusinessSettingsService.getBusinessSettingsWithDefaults();
      
      const baseUrl = window.location.origin;
      const reviewUrl = `${baseUrl}/review?utm_source=email&utm_campaign=review_request&customer=${encodeURIComponent(customerName)}&tracking_id=${trackingId || 'none'}`;
      
      const subject = `We'd love your feedback, ${customerName}!`;
      
      // Generate HTML email template
      const html = this.generateHtmlEmailTemplate({
        customerName,
        businessName: businessSettings.business_name || businessName,
        businessEmail: businessSettings.business_email,
        businessPhone: businessSettings.business_phone,
        businessAddress: businessSettings.business_address,
        reviewUrl,
        managerName
      });

      // Generate plain text version
      const body = this.generatePlainTextEmailTemplate({
        customerName,
        businessName: businessSettings.business_name || businessName,
        businessEmail: businessSettings.business_email,
        businessPhone: businessSettings.business_phone,
        businessAddress: businessSettings.business_address,
        reviewUrl,
        managerName
      });

      return {
        to: customerEmail,
        subject,
        body,
        html
      };
    } catch (error) {
      logger.error('Failed to generate email template', error as Error, { 
        component: 'UnifiedEmailService',
        action: 'generateReviewEmailTemplate'
      });
      
      // Return fallback template
      return {
        to: customerEmail,
        subject: `We'd love your feedback, ${customerName}!`,
        body: `Hi ${customerName},\n\nWe hope you enjoyed your experience with ${businessName}. We'd love to hear your feedback!\n\nPlease leave us a review: ${window.location.origin}/review\n\nThank you!`,
        html: `<p>Hi ${customerName},</p><p>We hope you enjoyed your experience with ${businessName}. We'd love to hear your feedback!</p><p><a href="${window.location.origin}/review">Please leave us a review</a></p><p>Thank you!</p>`
      };
    }
  }

  /**
   * Send email using the best available method (Resend > EmailJS > Mailto)
   */
  static async sendEmail(emailData: EmailData): Promise<EmailSendingResult> {
    try {
      this.initialize();

      // Try Resend first (preferred method)
      if (this.isResendConfigured()) {
        const resendResult = await this.sendWithResend(emailData);
        if (resendResult.success) {
          return resendResult;
        }
        logger.warn('Resend failed, falling back to EmailJS', {
          component: 'UnifiedEmailService',
          action: 'sendEmail',
          error: resendResult.error
        });
      }

      // Try EmailJS as fallback
      if (this.isEmailJSConfigured()) {
        const emailjsResult = await this.sendWithEmailJS(emailData);
        if (emailjsResult.success) {
          return emailjsResult;
        }
        logger.warn('EmailJS failed, falling back to mailto', {
          component: 'UnifiedEmailService',
          action: 'sendEmail',
          error: emailjsResult.error
        });
      }

      // Fallback to mailto link
      return await this.sendWithMailto(emailData);
    } catch (error) {
      logger.error('Email sending error', error as Error, {
        component: 'UnifiedEmailService',
        action: 'sendEmail',
        to: emailData.to
      });
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email using Resend API (preferred method)
   */
  private static async sendWithResend(emailData: EmailData): Promise<EmailSendingResult> {
    try {
      if (!this.resendApiKey) {
        throw new Error('Resend API key not configured');
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Crux Review System <noreply@crux-reviews.com>',
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html || emailData.body,
          text: emailData.body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resend API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      logger.info('Email sent successfully via Resend', {
        component: 'UnifiedEmailService',
        action: 'sendWithResend',
        to: emailData.to,
        messageId: result.id
      });

      return {
        success: true,
        message: 'Email sent successfully via Resend'
      };
    } catch (error) {
      logger.error('Resend API error', error as Error, {
        component: 'UnifiedEmailService',
        action: 'sendWithResend',
        to: emailData.to
      });
      return {
        success: false,
        message: 'Failed to send email via Resend',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email using EmailJS service
   */
  private static async sendWithEmailJS(emailData: EmailData): Promise<EmailSendingResult> {
    try {
      if (!this.isEmailJSConfigured()) {
        throw new Error('EmailJS configuration is incomplete');
      }

      const templateParams = {
        to_email: emailData.to,
        subject: emailData.subject,
        message: emailData.html || emailData.body,
        from_name: 'Crux Review System'
      };

      const result = await (window as any).emailjs.send(
        this.emailjsServiceId,
        this.emailjsTemplateId,
        templateParams,
        this.emailjsUserId
      );

      logger.info('Email sent successfully via EmailJS', {
        component: 'UnifiedEmailService',
        action: 'sendWithEmailJS',
        to: emailData.to,
        status: result.status
      });

      return {
        success: true,
        message: 'Email sent successfully via EmailJS'
      };
    } catch (error) {
      logger.error('EmailJS error', error as Error, {
        component: 'UnifiedEmailService',
        action: 'sendWithEmailJS',
        to: emailData.to
      });
      return {
        success: false,
        message: 'Failed to send email via EmailJS',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email using mailto link (fallback)
   */
  private static async sendWithMailto(emailData: EmailData): Promise<EmailSendingResult> {
    try {
      const mailtoUrl = this.createMailtoUrl(emailData);
      
      // Open mailto link
      window.open(mailtoUrl, '_blank');
      
      logger.info('Email opened in default mail client', {
        component: 'UnifiedEmailService',
        action: 'sendWithMailto',
        to: emailData.to
      });

      return {
        success: true,
        message: 'Email opened in your default mail client'
      };
    } catch (error) {
      logger.error('Mailto error', error as Error, {
        component: 'UnifiedEmailService',
        action: 'sendWithMailto',
        to: emailData.to
      });
      return {
        success: false,
        message: 'Failed to open email client',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create mailto URL for fallback email sending
   */
  private static createMailtoUrl(emailData: EmailData): string {
    const params = new URLSearchParams({
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body
    });
    
    return `mailto:?${params.toString()}`;
  }

  /**
   * Copy email to clipboard
   */
  static async copyEmailToClipboard(emailData: EmailData): Promise<boolean> {
    try {
      const emailText = `To: ${emailData.to}\nSubject: ${emailData.subject}\n\n${emailData.body}`;
      await navigator.clipboard.writeText(emailText);
      
      logger.info('Email copied to clipboard', {
        component: 'UnifiedEmailService',
        action: 'copyEmailToClipboard',
        to: emailData.to
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to copy email to clipboard', error as Error, {
        component: 'UnifiedEmailService',
        action: 'copyEmailToClipboard'
      });
      return false;
    }
  }

  /**
   * Check if Resend is configured
   */
  static isResendConfigured(): boolean {
    this.initialize();
    return !!this.resendApiKey;
  }

  /**
   * Check if EmailJS is configured
   */
  static isEmailJSConfigured(): boolean {
    this.initialize();
    return !!(this.emailjsUserId && this.emailjsServiceId && this.emailjsTemplateId);
  }

  /**
   * Open email client with mailto link
   */
  static openEmailClient(emailData: EmailData): void {
    const mailtoUrl = this.createMailtoUrl(emailData);
    window.open(mailtoUrl, '_blank');
    
    logger.info('Email client opened', {
      component: 'UnifiedEmailService',
      action: 'openEmailClient',
      to: emailData.to
    });
  }

  /**
   * Generate HTML email template
   */
  private static generateHtmlEmailTemplate(data: {
    customerName: string;
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessAddress: string;
    reviewUrl: string;
    managerName?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Review Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { padding: 20px 0; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Thank you for choosing ${data.businessName}!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${data.customerName},</p>
          
          <p>We hope you had a great experience with our services. Your feedback is incredibly valuable to us and helps us improve.</p>
          
          <p>Would you mind taking a moment to share your experience? It only takes a minute and would mean the world to us!</p>
          
          <div style="text-align: center;">
            <a href="${data.reviewUrl}" class="button">Leave a Review</a>
          </div>
          
          <p>Thank you for your time and for choosing ${data.businessName}!</p>
          
          ${data.managerName ? `<p>Best regards,<br>${data.managerName}<br>${data.businessName}</p>` : `<p>Best regards,<br>The ${data.businessName} Team</p>`}
        </div>
        
        <div class="footer">
          <p><strong>${data.businessName}</strong></p>
          ${data.businessEmail ? `<p>Email: ${data.businessEmail}</p>` : ''}
          ${data.businessPhone ? `<p>Phone: ${data.businessPhone}</p>` : ''}
          ${data.businessAddress ? `<p>Address: ${data.businessAddress}</p>` : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email template
   */
  private static generatePlainTextEmailTemplate(data: {
    customerName: string;
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessAddress: string;
    reviewUrl: string;
    managerName?: string;
  }): string {
    return `
Hi ${data.customerName},

Thank you for choosing ${data.businessName}!

We hope you had a great experience with our services. Your feedback is incredibly valuable to us and helps us improve.

Would you mind taking a moment to share your experience? It only takes a minute and would mean the world to us!

Please leave us a review: ${data.reviewUrl}

Thank you for your time and for choosing ${data.businessName}!

${data.managerName ? `Best regards,\n${data.managerName}\n${data.businessName}` : `Best regards,\nThe ${data.businessName} Team`}

---
${data.businessName}
${data.businessEmail ? `Email: ${data.businessEmail}` : ''}
${data.businessPhone ? `Phone: ${data.businessPhone}` : ''}
${data.businessAddress ? `Address: ${data.businessAddress}` : ''}
    `.trim();
  }
}