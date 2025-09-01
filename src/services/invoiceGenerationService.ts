import { supabase } from "@/integrations/supabase/client";
import type { Invoice } from "@/types";

export class InvoiceGenerationService {
  /**
   * Generate PDF invoice from ODT template
   */
  static async generateInvoicePDF(invoice: Invoice): Promise<Blob> {
    try {
      // Get business settings for template
      const { data: settings } = await supabase
        .from('business_settings')
        .select('invoice_template_url, business_name, business_email, business_phone, business_address')
        .single();

      if (!settings?.invoice_template_url) {
        throw new Error('No invoice template configured. Please upload a template in Settings.');
      }

      // Prepare template data
      const templateData = {
        // Invoice data
        invoice_number: invoice.invoice_number,
        invoice_date: new Date(invoice.created_at).toLocaleDateString(),
        due_date: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A',
        
        // Customer data
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        customer_phone: invoice.customer_phone || 'N/A',
        customer_address: invoice.customer_address || 'N/A',
        
        // Business data
        business_name: settings.business_name || 'Your Business',
        business_email: settings.business_email || 'contact@yourbusiness.com',
        business_phone: settings.business_phone || 'N/A',
        business_address: settings.business_address || 'N/A',
        
        // Item data
        item_description: invoice.item_description,
        quantity: invoice.quantity.toString(),
        unit_price: invoice.unit_price.toFixed(2),
        total: invoice.total.toFixed(2),
        currency: invoice.currency,
        
        // Additional data
        notes: invoice.notes || '',
        status: invoice.status.toUpperCase()
      };

      // Call Supabase Edge Function to generate PDF
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: {
          templateUrl: settings.invoice_template_url,
          templateData,
          invoiceId: invoice.id
        }
      });

      if (error) throw error;

      // Convert base64 to blob
      const pdfBlob = new Blob([Buffer.from(data.pdf, 'base64')], { 
        type: 'application/pdf' 
      });

      return pdfBlob;
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw new Error('Failed to generate invoice PDF. Please try again.');
    }
  }

  /**
   * Download invoice as PDF
   */
  static async downloadInvoicePDF(invoice: Invoice): Promise<void> {
    try {
      const pdfBlob = await this.generateInvoicePDF(invoice);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Send invoice via email
   */
  static async sendInvoiceEmail(invoice: Invoice, recipientEmail?: string): Promise<void> {
    try {
      const email = recipientEmail || invoice.customer_email;
      
      // Generate PDF first
      const pdfBlob = await this.generateInvoicePDF(invoice);
      
      // Convert blob to base64 for email attachment
      const base64Pdf = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(pdfBlob);
      });

      // Call Supabase Edge Function to send email
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoice,
          recipientEmail: email,
          pdfAttachment: base64Pdf
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw new Error('Failed to send invoice email. Please try again.');
    }
  }

  /**
   * Get invoice template placeholders
   */
  static getTemplatePlaceholders(): Record<string, string> {
    return {
      // Invoice placeholders
      '{{invoice_number}}': 'Invoice number (e.g., INV-202401-001)',
      '{{invoice_date}}': 'Invoice creation date',
      '{{due_date}}': 'Payment due date',
      
      // Customer placeholders
      '{{customer_name}}': 'Customer full name',
      '{{customer_email}}': 'Customer email address',
      '{{customer_phone}}': 'Customer phone number',
      '{{customer_address}}': 'Customer address',
      
      // Business placeholders
      '{{business_name}}': 'Your business name',
      '{{business_email}}': 'Your business email',
      '{{business_phone}}': 'Your business phone',
      '{{business_address}}': 'Your business address',
      
      // Item placeholders
      '{{item_description}}': 'Product/service description',
      '{{quantity}}': 'Item quantity',
      '{{unit_price}}': 'Price per unit',
      '{{total}}': 'Total amount',
      '{{currency}}': 'Currency code (USD, EUR, etc.)',
      
      // Additional placeholders
      '{{notes}}': 'Additional notes or terms',
      '{{status}}': 'Invoice status (DRAFT, SENT, PAID, OVERDUE)'
    };
  }

  /**
   * Validate template file
   */
  static validateTemplate(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.odt')) {
      return { valid: false, error: 'Template must be an ODT file' };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'Template file must be smaller than 10MB' };
    }

    return { valid: true };
  }
}
