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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Method not allowed" 
      }),
      {
        status: 405,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders,
          "Allow": "POST, OPTIONS"
        },
      }
    );
  }

  try {
    // Parse request body with error handling
    let requestData: {
      invoice: Invoice;
      recipientEmail: string;
      pdfAttachment: string;
    };
    
    try {
      requestData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid JSON in request body" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { invoice, recipientEmail, pdfAttachment } = requestData;

    if (!invoice || !recipientEmail) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Resend API key not configured" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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

    // Send email using Resend with proper error handling
    let emailResponse: Response;
    try {
      emailResponse = await fetch("https://api.resend.com/emails", {
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
    } catch (fetchError) {
      console.error("Network error sending email:", fetchError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Network error while sending email" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!emailResponse.ok) {
      let errorMessage = "Unknown error";
      try {
        const errorData = await emailResponse.json();
        errorMessage = errorData.message || `HTTP ${emailResponse.status}`;
      } catch {
        errorMessage = `HTTP ${emailResponse.status} ${emailResponse.statusText}`;
      }
      
      console.error("Resend API error:", errorMessage);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Resend API error: ${errorMessage}` 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let emailData: any;
    try {
      emailData = await emailResponse.json();
    } catch (parseError) {
      console.error("Error parsing email response:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid response from email service" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    if (!emailData.id) {
      console.error("No email ID in response:", emailData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Failed to send email - no response ID received" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log("Invoice email sent successfully:", {
      invoiceId: invoice.id,
      recipientEmail,
      emailId: emailData.id
    });

    return new Response(JSON.stringify({ 
      success: true,
      data: {
        id: emailData.id,
        recipient: recipientEmail,
        invoiceNumber: invoice.invoice_number
      },
      message: "Invoice email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Unexpected error in send-invoice-email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An unexpected error occurred" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
