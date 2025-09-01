import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  currency: string;
  due_date?: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice, recipientEmail, pdfAttachment }: {
      invoice: Invoice;
      recipientEmail: string;
      pdfAttachment: string;
    } = await req.json();

    if (!invoice || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .invoice-details { background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          .footer { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; font-size: 14px; color: #6c757d; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invoice ${invoice.invoice_number}</h1>
          <p>Dear ${invoice.customer_name},</p>
          <p>Thank you for your business! Please find your invoice attached.</p>
        </div>
        
        <div class="invoice-details">
          <h2>Invoice Details</h2>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Amount Due:</strong> <span class="amount">${invoice.currency} ${invoice.total.toFixed(2)}</span></p>
          ${invoice.due_date ? `<p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>` : ''}
          <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="#" class="button">View Invoice Online</a>
        </div>
        
        <div class="footer">
          <p>This invoice was generated automatically. If you have any questions, please contact us.</p>
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Alpha Business Designs <noreply@alphabusiness.com>",
        to: [recipientEmail],
        subject: `Invoice ${invoice.invoice_number} - ${invoice.currency} ${invoice.total.toFixed(2)}`,
        html: emailHtml,
        attachments: [
          {
            filename: `invoice-${invoice.invoice_number}.pdf`,
            content: pdfAttachment.split(',')[1], // Remove data:application/pdf;base64, prefix
            type: "application/pdf"
          }
        ]
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`);
    }

    const emailData = await emailResponse.json();
    
    console.log("Invoice email sent:", {
      invoiceId: invoice.id,
      recipientEmail,
      emailId: emailData.id
    });

    return new Response(JSON.stringify({ 
      success: true,
      emailId: emailData.id,
      message: "Invoice email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invoice email",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
