/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
/// <reference types="https://deno.land/x/types/index.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@1.1.0";

// Configuration interface
interface Config {
  resendApiKey: string;
  supabaseUrl: string;
  frontendUrl: string;
  googleReviewUrl: string;
  allowedOrigins: string[];
}

// Request/Response interfaces
interface ReviewEmailRequest {
  recipientEmail: string;
  managerName?: string;
  customerName?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  trackingId?: string;
}

// Custom error classes
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Configuration loader with validation
function loadConfig(): Config {
  const config = {
    resendApiKey: Deno.env.get("RESEND_API_KEY"),
    supabaseUrl: Deno.env.get("SUPABASE_URL"),
    frontendUrl: Deno.env.get("FRONTEND_URL") || "https://invoice-app-iota-livid.vercel.app/",
    googleReviewUrl: Deno.env.get("GOOGLE_REVIEW_URL") || "https://g.page/r/CZEmfT3kD-k-EBM/review",
    allowedOrigins: (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").filter(Boolean),
  };

  // Validate required config
  if (!config.resendApiKey) {
    throw new ConfigurationError("RESEND_API_KEY environment variable is required");
  }
  if (!config.supabaseUrl) {
    throw new ConfigurationError("SUPABASE_URL environment variable is required");
  }

  return config as Config;
}

// Input sanitization utility
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Input validation utilities
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateInput(data: ReviewEmailRequest): void {
  if (!data.recipientEmail || typeof data.recipientEmail !== 'string') {
    throw new ValidationError("Valid recipient email is required");
  }

  if (!validateEmail(data.recipientEmail)) {
    throw new ValidationError("Invalid email format");
  }

  if (data.managerName && data.managerName.length > 100) {
    throw new ValidationError("Manager name too long");
  }
}

// Enhanced tracking ID generator
function generateTrackingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}_${random}`;
}

// CORS configuration
function getCorsHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, ApiKey",
  };

  // Set appropriate CORS origin
  if (allowedOrigins.length > 0 && origin && allowedOrigins.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  } else if (allowedOrigins.length === 0) {
    corsHeaders["Access-Control-Allow-Origin"] = "*"; // Only for development
  }

  return corsHeaders;
}

// Email template service
class EmailTemplateService {
  constructor(private config: Config) {}

  generateReviewEmail(data: ReviewEmailRequest, trackingId: string): string {
    const managerName = sanitizeHtml(data.managerName || "Alpha Business Design");
    const reviewUrl = `${this.config.frontendUrl}/review?token=${trackingId}`;
    const customerName = data.customerName ? sanitizeHtml(data.customerName) : "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Share Your Experience - ${managerName}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
      background-color: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      font-size: 18px;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .content h2 {
      color: #1e293b;
      margin-bottom: 15px;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white !important;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
    }
    .cta-button:hover {
      background: #1d4ed8;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .container { padding: 20px; }
      .cta-button { display: block; margin: 20px 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${managerName}</h1>
      <p>We'd love to hear about your experience!</p>
    </div>
    
    <div class="content">
      ${customerName ? `<p>Hi ${customerName},</p>` : '<p>Hello,</p>'}
      
      <p>Thank you for choosing ${managerName}. Your feedback is incredibly valuable to us and helps us continue providing excellent service.</p>
      
      <p><strong>Your review takes less than 2 minutes and would mean the world to us!</strong></p>
      
      <div style="text-align: center;">
        <a href="${reviewUrl}" class="cta-button">
          ⭐ Share Your Experience
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        <em>This secure link is unique to you and will expire in 30 days.</em>
      </p>
    </div>
    
    <div class="footer">
      <p>Thank you for choosing ${managerName}!</p>
      <p style="margin-top: 10px;">
        <em>If you have any questions, please don't hesitate to contact us.</em>
      </p>
    </div>
  </div>
</body>
</html>`;
  }
}

// Main handler function
const handler = async (req: Request): Promise<Response> => {
  let config: Config;
  
  try {
    config = loadConfig();
  } catch (error) {
    console.error("Configuration error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Service configuration error" 
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, ApiKey"
        } 
      }
    );
  }

  const corsHeaders = getCorsHeaders(
    req.headers.get('origin'), 
    config.allowedOrigins
  );

  // Handle CORS preflight
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
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Allow": "POST, OPTIONS"
        } 
      }
    );
  }

  try {
    // Parse and validate request
    let requestData: ReviewEmailRequest;
    
    try {
      requestData = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON in request body");
    }

    validateInput(requestData);

    const trackingId = generateTrackingId();
    const emailService = new EmailTemplateService(config);
    const emailHtml = emailService.generateReviewEmail(requestData, trackingId);

    // Initialize Resend client
    const resend = new Resend(config.resendApiKey);

    // Send email with proper error handling
    const emailResponse = await resend.emails.send({
      from: `${requestData.managerName || "Alpha Business"} <onboarding@resend.dev>`,
      to: [requestData.recipientEmail],
      subject: `We'd love your feedback! - ${requestData.managerName || "Alpha Business Design"}`,
      html: emailHtml,
    });

    // Check for Resend API errors
    if (emailResponse.error) {
      throw new Error(`Resend API error: ${emailResponse.error.message}`);
    }

    if (!emailResponse.data?.id) {
      console.error("Resend response:", emailResponse);
      throw new Error("Failed to send email - no response ID received");
    }

    console.log(`Review email sent successfully: ${emailResponse.data.id}, tracking: ${trackingId}`);

    const response: ApiResponse = {
      success: true,
      data: {
        id: emailResponse.data.id,
        recipient: requestData.recipientEmail,
        managerName: requestData.managerName || "Alpha Business Design"
      },
      trackingId
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error("Handler error:", error);
    
    const statusCode = error instanceof ValidationError ? 400 : 500;
    const errorMessage = error instanceof ValidationError 
      ? error.message 
      : "An unexpected error occurred";

    const response: ApiResponse = {
      success: false,
      error: errorMessage
    };

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      },
    });
  }
};

serve(handler);