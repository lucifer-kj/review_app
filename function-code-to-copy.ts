// deno-lint-ignore-file
// @ts-ignore - Deno-specific imports
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno-specific imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewEmailRequest {
  customerEmail: string;
  customerName: string;
  trackingId?: string;
  managerName?: string;
  businessName?: string;
}

interface EmailResponse {
  id: string;
  message?: string;
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
    let requestData: ReviewEmailRequest;
    
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

    const { customerEmail, customerName, trackingId, managerName, businessName = "Alpha Business Designs" } = requestData;

    if (!customerEmail || !customerName) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters: customerEmail and customerName" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid email format" 
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

    // Create tracking URL with UTM parameters
    const baseUrl = Deno.env.get("FRONTEND_URL") || "https://yourdomain.com";
    const reviewUrl = `${baseUrl}/review?utm_source=email&utm_campaign=review_request&tracking_id=${trackingId || 'none'}&customer=${encodeURIComponent(customerName)}`;

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>We'd love your feedback!</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f9f9f9;
          }
          .container { 
            background: #ffffff; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            color: #007bff; 
            margin-bottom: 10px; 
            font-size: 28px;
          }
          .header p { 
            color: #666; 
            font-size: 16px; 
            margin: 0;
          }
          .content { 
            margin-bottom: 30px; 
          }
          .content p { 
            margin-bottom: 15px; 
            font-size: 16px;
          }
          .button-container { 
            text-align: center; 
            margin: 30px 0; 
          }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold; 
            font-size: 16px;
            transition: background-color 0.3s ease;
          }
          .button:hover { 
            background: #0056b3; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            font-size: 14px; 
            color: #6c757d; 
            margin-top: 30px;
          }
          .footer p { 
            margin: 5px 0; 
          }
          .highlight { 
            background: #e3f2fd; 
            padding: 15px; 
            border-radius: 6px; 
            border-left: 4px solid #007bff; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${businessName}</h1>
            <p>We'd love your feedback!</p>
          </div>
          
          <div class="content">
            <p>Hello ${customerName},</p>
            
            <p>Thank you for choosing ${businessName}! We hope you had a great experience with our services.</p>
            
            <div class="highlight">
              <p><strong>Your feedback matters to us!</strong> Please take just 2 minutes to share your experience and help us improve our services.</p>
            </div>
            
            <p>Your review helps us:</p>
            <ul>
              <li>Improve our services for future customers</li>
              <li>Recognize our team members who provided excellent service</li>
              <li>Build trust with potential customers</li>
            </ul>
          </div>
          
          <div class="button-container">
            <a href="${reviewUrl}" class="button">Leave a Review</a>
          </div>
          
          <div class="footer">
            <p><strong>Thank you for your time and feedback!</strong></p>
            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The ${businessName} Team</p>
            ${managerName ? `<p><em>Requested by: ${managerName}</em></p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend with proper error handling
    let emailResponse: Response | null = null;
    try {
      emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${businessName} <noreply@alphabusiness.com>`,
          to: [customerEmail],
          subject: `We'd love your feedback, ${customerName}!`,
          html: emailHtml,
        }),
      });
    } catch (fetchError) {
      console.error("Network error sending review email:", fetchError);
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

    if (!emailResponse || !emailResponse.ok) {
      let errorMessage = "Unknown error";
      try {
        if (emailResponse) {
          const errorData = await emailResponse.json() as EmailResponse;
          errorMessage = errorData.message || `HTTP ${emailResponse.status}`;
        }
      } catch {
        if (emailResponse) {
          errorMessage = `HTTP ${emailResponse.status} ${emailResponse.statusText}`;
        }
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

    let emailData: EmailResponse | null = null;
    try {
      emailData = await emailResponse.json() as EmailResponse;
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
    
    if (!emailData || !emailData.id) {
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
    
    console.log("Review email sent successfully:", {
      customerEmail,
      customerName,
      trackingId,
      managerName,
      emailId: emailData.id
    });

    return new Response(JSON.stringify({ 
      success: true,
      data: {
        id: emailData.id,
        recipient: customerEmail,
        customerName,
        trackingId
      },
      message: "Review email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Unexpected error in send-review-email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
