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
}

export class EmailService {
  /**
   * Generate a review email template with all necessary information
   */
  static generateReviewEmailTemplate(data: EmailTemplateData): EmailData {
    const {
      customerEmail,
      customerName,
      businessName,
      managerName,
      trackingId
    } = data;

    const baseUrl = window.location.origin;
    const reviewUrl = `${baseUrl}/review?utm_source=email&utm_campaign=review_request&customer=${encodeURIComponent(customerName)}&tracking_id=${trackingId || 'none'}`;
    
    const subject = `We'd love your feedback, ${customerName}!`;
    
    const body = `
Hello ${customerName},

Thank you for choosing ${businessName}! We hope you had a great experience with our services.

Your feedback matters to us! Please take just 2 minutes to share your experience and help us improve our services.

Your review helps us:
• Improve our services for future customers
• Recognize our team members who provided excellent service
• Build trust with potential customers

Please click the link below to leave your review:
${reviewUrl}

Thank you for your time and feedback!

Best regards,
The ${businessName} Team
${managerName ? `Requested by: ${managerName}` : ''}

---
This email was sent from ${businessName}'s review management system.
    `.trim();

    return {
      to: customerEmail,
      subject,
      body
    };
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
   * Generate a simple text version of the email for fallback
   */
  static generateTextEmail(data: EmailTemplateData): string {
    const {
      customerName,
      businessName,
      managerName,
      trackingId
    } = data;

    const baseUrl = window.location.origin;
    const reviewUrl = `${baseUrl}/review?utm_source=email&utm_campaign=review_request&customer=${encodeURIComponent(customerName)}&tracking_id=${trackingId || 'none'}`;
    
    return `
Review Request Email Template

To: [Customer Email]
Subject: We'd love your feedback, ${customerName}!

Hello ${customerName},

Thank you for choosing ${businessName}! We hope you had a great experience with our services.

Your feedback matters to us! Please take just 2 minutes to share your experience and help us improve our services.

Your review helps us:
• Improve our services for future customers
• Recognize our team members who provided excellent service
• Build trust with potential customers

Please click the link below to leave your review:
${reviewUrl}

Thank you for your time and feedback!

Best regards,
The ${businessName} Team
${managerName ? `Requested by: ${managerName}` : ''}

---
This email was sent from ${businessName}'s review management system.
    `.trim();
  }
}
