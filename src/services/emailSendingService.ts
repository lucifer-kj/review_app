import { EmailData } from './emailService';
import { supabase } from '@/integrations/supabase/client';

export interface EmailSendingResult {
  success: boolean;
  message: string;
  error?: string;
}

export class EmailSendingService {
  private static emailjsUserId: string;
  private static emailjsServiceId: string;
  private static emailjsTemplateId: string;

  /**
   * Initialize EmailJS configuration
   */
  static initialize(): void {
    // These should be set in environment variables
    this.emailjsUserId = import.meta.env.VITE_EMAILJS_USER_ID || '';
    this.emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    this.emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
  }

  /**
   * Send email using EmailJS
   */
  static async sendEmail(emailData: EmailData): Promise<EmailSendingResult> {
    try {
      // Check if EmailJS is available
      if (typeof window !== 'undefined' && (window as any).emailjs) {
        return await this.sendWithEmailJS(emailData);
      } else {
        // Fallback to mailto link
        return await this.sendWithMailto(emailData);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email using EmailJS service
   */
  private static async sendWithEmailJS(emailData: EmailData): Promise<EmailSendingResult> {
    try {
      const emailjs = (window as any).emailjs;
      
      if (!this.emailjsUserId || !this.emailjsServiceId || !this.emailjsTemplateId) {
        throw new Error('EmailJS configuration is missing. Please set up environment variables.');
      }

      const templateParams = {
        to_email: emailData.to,
        to_name: emailData.to.split('@')[0], // Extract name from email
        subject: emailData.subject,
        message: emailData.html || emailData.body,
        reply_to: emailData.to,
      };

      const result = await emailjs.send(
        this.emailjsServiceId,
        this.emailjsTemplateId,
        templateParams,
        this.emailjsUserId
      );

      if (result.status === 200) {
        return {
          success: true,
          message: 'Email sent successfully!'
        };
      } else {
        throw new Error(`EmailJS returned status: ${result.status}`);
      }
    } catch (error) {
      console.error('EmailJS error:', error);
      return {
        success: false,
        message: 'Failed to send email via EmailJS',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fallback: Send email using mailto link
   */
  private static async sendWithMailto(emailData: EmailData): Promise<EmailSendingResult> {
    try {
      const mailtoUrl = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      window.open(mailtoUrl, '_blank');
      
      return {
        success: true,
        message: 'Email client opened. Please send the email manually.'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to open email client',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email using Supabase Edge Function
   */
  static async sendEmailViaAPI(emailData: EmailData): Promise<EmailSendingResult> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.body,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.success) {
        return {
          success: true,
          message: 'Email sent successfully!'
        };
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('API email sending error:', error);
      return {
        success: false,
        message: 'Failed to send email via API',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Open the user's default email client with pre-filled email data
   */
  static openEmailClient(emailData: EmailData): void {
    const mailtoUrl = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.open(mailtoUrl, '_blank');
  }

  /**
   * Copy email data to clipboard for manual sending
   */
  static async copyEmailToClipboard(emailData: EmailData): Promise<boolean> {
    try {
      const emailText = `To: ${emailData.to}\nSubject: ${emailData.subject}\n\n${emailData.body}`;
      await navigator.clipboard.writeText(emailText);
      return true;
    } catch (error) {
      console.error('Failed to copy email to clipboard:', error);
      return false;
    }
  }

  /**
   * Get available sending methods
   */
  static getAvailableMethods(): string[] {
    const methods: string[] = [];
    
    if (typeof window !== 'undefined' && (window as any).emailjs) {
      methods.push('emailjs');
    }
    
    if (navigator && navigator.clipboard) {
      methods.push('clipboard');
    }
    
    methods.push('mailto');
    
    return methods;
  }

  /**
   * Check if EmailJS is configured
   */
  static isEmailJSConfigured(): boolean {
    return !!(this.emailjsUserId && this.emailjsServiceId && this.emailjsTemplateId);
  }
}

// Initialize the service when the module loads
EmailSendingService.initialize();
