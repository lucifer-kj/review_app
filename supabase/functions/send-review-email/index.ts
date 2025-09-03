// deno-lint-ignore-file
// @ts-ignore - Deno-specific imports
// @deno-types="https://deno.land/std@0.190.0/http/server.ts"
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno-specific imports
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Simple in-memory rate limiting (for production, consider using Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  MAX_REQUESTS: 10, // Maximum requests per window
  WINDOW_MS: 60 * 1000, // 1 minute window
  BLOCK_DURATION_MS: 5 * 60 * 1000, // 5 minutes block duration
};

// Standardized error messages
const ERROR_MESSAGES = {
  METHOD_NOT_ALLOWED: "Method not allowed. Only POST requests are accepted.",
  INVALID_JSON: "Invalid JSON format in request body.",
  MISSING_PARAMETERS: "Missing required parameters: customerEmail and customerName",
  INVALID_EMAIL: "Invalid email format provided.",
  RESEND_API_MISSING: "Email service configuration is missing. Please contact support.",
  EMAIL_CONFIG_MISSING: "Email configuration is incomplete. Please contact support.",
  NETWORK_ERROR: "Network error occurred while sending email. Please try again.",
  RESEND_API_ERROR: "Email service error occurred. Please try again later.",
  INVALID_RESPONSE: "Invalid response received from email service.",
  NO_EMAIL_ID: "Email service did not return a valid response ID.",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later.",
  UNAUTHORIZED_ORIGIN: "Unauthorized origin. Access denied.",
  UNEXPECTED_ERROR: "An unexpected error occurred. Please try again later.",
} as const;

// Standardized error response function
const createErrorResponse = (message: string, status: number, code?: string) => {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code: code || `HTTP_${status}`,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
};

// Email template generation function
interface EmailTemplateParams {
  businessName: string;
  customerName: string;
  managerName?: string;
  reviewUrl: string;
  primaryColor: string;
  buttonText: string;
  emailTitle: string;
  template: string;
}

const generateEmailTemplate = (params: EmailTemplateParams): string => {
  const { businessName, customerName, managerName, reviewUrl, primaryColor, buttonText, emailTitle, template } = params;
  
  // Calculate darker shade for button hover
  const darkerColor = primaryColor === "#007bff" ? "#0056b3" : primaryColor;
  
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailTitle}</title>
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
          color: ${primaryColor}; 
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
          background: ${primaryColor}; 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold; 
          font-size: 16px;
          transition: background-color 0.3s ease;
        }
        .button:hover { 
          background: ${darkerColor}; 
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
          border-left: 4px solid ${primaryColor}; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${businessName}</h1>
          <p>${emailTitle}</p>
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
          <a href="${reviewUrl}" class="button">${buttonText}</a>
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
  
  // Add template variations based on template type
  switch (template) {
    case "minimal":
      return baseTemplate.replace(/<div class="highlight">[\s\S]*?<\/div>/, "")
                        .replace(/<p>Your review helps us:<\/p>[\s\S]*?<\/ul>/, "");
    case "professional":
      return baseTemplate.replace(/background: #f9f9f9;/, "background: #f5f5f5;")
                        .replace(/border-radius: 8px;/, "border-radius: 12px;");
    default:
      return baseTemplate;
  }
};

// Get allowed origins from environment or use default
const getAllowedOrigins = () => {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (allowedOrigins) {
    return allowedOrigins.split(",").map(origin => origin.trim());
  }
  // Default to common development and production URLs
  return [
    "http://localhost:3000",
    "http://localhost:5173", 
    "http://localhost:4173",
    "https://invoice-app-iota-livid.vercel.app",
    "https://alpha-business.vercel.app"
  ];
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewEmailRequest {
  customerEmail: string;
  customerName: string;
  trackingId?: string;
  managerName?: string;
  businessName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Get origin from request headers
  const origin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  
  // Set CORS headers based on origin
  const responseHeaders = {
    ...corsHeaders,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    if (origin && allowedOrigins.includes(origin)) {
      responseHeaders["Access-Control-Allow-Origin"] = origin;
    }
    return new Response(null, { 
      status: 200,
      headers: responseHeaders 
    });
  }
  
  // Check origin for actual requests
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn("Blocked request from unauthorized origin:", origin);
    return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED_ORIGIN, 403, "UNAUTHORIZED_ORIGIN");
  }
  
  // Set CORS origin for successful requests
  if (origin && allowedOrigins.includes(origin)) {
    responseHeaders["Access-Control-Allow-Origin"] = origin;
  }
  
  // Rate limiting check
  const clientIP = req.headers.get("x-forwarded-for") || 
                   req.headers.get("x-real-ip") || 
                   "unknown";
  const rateLimitKey = `email:${clientIP}`;
  
  const now = Date.now();
  const rateLimitData = rateLimitStore.get(rateLimitKey);
  
  if (rateLimitData) {
    // Check if we're in the block period
    if (rateLimitData.resetTime > now) {
      console.warn("Rate limit exceeded for IP:", clientIP);
      const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000).toString();
      const errorResponse = createErrorResponse(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, 429, "RATE_LIMIT_EXCEEDED");
      errorResponse.headers.set("Retry-After", retryAfter);
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }
    
    // Reset if window has passed
    if (rateLimitData.count >= RATE_LIMIT.MAX_REQUESTS) {
      rateLimitStore.delete(rateLimitKey);
    }
  }
  
  // Update rate limit counter
  const currentCount = (rateLimitData?.count || 0) + 1;
  const resetTime = now + RATE_LIMIT.WINDOW_MS;
  
  if (currentCount >= RATE_LIMIT.MAX_REQUESTS) {
    rateLimitStore.set(rateLimitKey, { 
      count: currentCount, 
      resetTime: now + RATE_LIMIT.BLOCK_DURATION_MS 
    });
  } else {
    rateLimitStore.set(rateLimitKey, { count: currentCount, resetTime });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    const errorResponse = createErrorResponse(ERROR_MESSAGES.METHOD_NOT_ALLOWED, 405, "METHOD_NOT_ALLOWED");
    errorResponse.headers.set("Allow", "POST, OPTIONS");
    Object.entries(responseHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }

  try {
    // Parse request body with error handling
    let requestData: ReviewEmailRequest;
    
    try {
      requestData = await req.json();
    } catch {
      const errorResponse = createErrorResponse(ERROR_MESSAGES.INVALID_JSON, 400, "INVALID_JSON");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    const { customerEmail, customerName, trackingId, managerName, businessName = "Alpha Business Designs" } = requestData;
    
    // Input sanitization to prevent XSS
    const sanitizeInput = (input: string): string => {
      if (!input) return "";
      return input
        .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/on\w+=/gi, "") // Remove event handlers
        .trim();
    };
    
    const sanitizedCustomerName = sanitizeInput(customerName);
    const sanitizedManagerName = managerName ? sanitizeInput(managerName) : "";
    const sanitizedBusinessName = sanitizeInput(businessName);

    if (!customerEmail || !customerName) {
      const errorResponse = createErrorResponse(ERROR_MESSAGES.MISSING_PARAMETERS, 400, "MISSING_PARAMETERS");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Validate email format using standard regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      const errorResponse = createErrorResponse(ERROR_MESSAGES.INVALID_EMAIL, 400, "INVALID_EMAIL");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      const errorResponse = createErrorResponse(ERROR_MESSAGES.RESEND_API_MISSING, 500, "RESEND_API_MISSING");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Get email configuration
    const emailDomain = Deno.env.get("EMAIL_DOMAIN") || "alphabusiness.com";
    const emailFromName = Deno.env.get("EMAIL_FROM_NAME") || "noreply";
    
    // Validate email configuration
    if (!emailDomain || !emailFromName) {
      console.error("Email configuration missing:", { emailDomain, emailFromName });
      const errorResponse = createErrorResponse(ERROR_MESSAGES.EMAIL_CONFIG_MISSING, 500, "EMAIL_CONFIG_MISSING");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Create tracking URL with UTM parameters and signed one-tap rating support
    const baseUrl = Deno.env.get("FRONTEND_URL") || "https://yourdomain.com";
    const nowTs = Math.floor(Date.now() / 1000);
    const countryCode = "+1";
    const phone = ""; // Not known in email-only flow
    const secret = Deno.env.get("REVIEW_LINK_SECRET") || "";

    const buildSignedUrl = async (rating: number) => {
      const params = new URLSearchParams({
        utm_source: "email",
        utm_campaign: "review_request",
        tracking_id: String(trackingId || "none"),
        customer: sanitizedCustomerName,
        name: sanitizedCustomerName,
        phone,
        countryCode,
        rating: String(rating),
        ts: String(nowTs)
      });
      if (!secret) {
        return `${baseUrl}/review?${params.toString()}`;
      }
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const payload = `name=${sanitizedCustomerName}&phone=${phone}&countryCode=${countryCode}&rating=${rating}&trackingId=${trackingId || 'none'}&ts=${nowTs}`;
      const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
      const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
      params.set("sig", sig);
      return `${baseUrl}/review?${params.toString()}`;
    };

    const reviewUrl = await buildSignedUrl(5);

    // Get email template configuration
    const emailTemplate = Deno.env.get("EMAIL_TEMPLATE") || "default";
    const primaryColor = Deno.env.get("EMAIL_PRIMARY_COLOR") || "#007bff";
    const buttonText = Deno.env.get("EMAIL_BUTTON_TEXT") || "Leave a Review";
    const emailTitle = Deno.env.get("EMAIL_TITLE") || "We'd love your feedback!";
    
    // Prepare email content with configurable template
    const emailHtml = generateEmailTemplate({
      businessName: sanitizedBusinessName,
      customerName: sanitizedCustomerName,
      managerName: sanitizedManagerName,
      reviewUrl,
      primaryColor,
      buttonText,
      emailTitle,
      template: emailTemplate
    });

    // Send email using Resend with retry logic
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second
    
    let emailResponse: Response | null = null;
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${sanitizedBusinessName} <${emailFromName}@${emailDomain}>`,
            to: [customerEmail],
            subject: `We'd love your feedback, ${sanitizedCustomerName}!`,
            html: emailHtml,
          }),
        });
        
        // If successful, break out of retry loop
        if (emailResponse.ok) {
          break;
        }
        
        // If not successful and this is the last attempt, throw error
        if (attempt === MAX_RETRIES) {
          throw new Error(`HTTP ${emailResponse.status}: ${emailResponse.statusText}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        
      } catch (fetchError) {
        lastError = fetchError;
        console.error(`Email send attempt ${attempt} failed:`, fetchError);
        
        // If this is the last attempt, return error
        if (attempt === MAX_RETRIES) {
          const errorResponse = createErrorResponse(ERROR_MESSAGES.NETWORK_ERROR, 500, "NETWORK_ERROR");
          Object.entries(responseHeaders).forEach(([key, value]) => {
            errorResponse.headers.set(key, value);
          });
          return errorResponse;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }

    // Ensure emailResponse is not null after retry loop
    if (!emailResponse) {
      const errorResponse = createErrorResponse(ERROR_MESSAGES.NETWORK_ERROR, 500, "NETWORK_ERROR");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
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
      const errorResponse = createErrorResponse(ERROR_MESSAGES.RESEND_API_ERROR, 500, "RESEND_API_ERROR");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    let emailData: unknown;
    try {
      emailData = await emailResponse.json();
    } catch (parseError) {
      console.error("Error parsing email response:", parseError);
      const errorResponse = createErrorResponse(ERROR_MESSAGES.INVALID_RESPONSE, 500, "INVALID_RESPONSE");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Type guard to check if emailData has an 'id' property
    type EmailDataWithId = { id: string };

    function hasIdProperty(obj: unknown): obj is EmailDataWithId {
      return typeof obj === "object" && obj !== null && "id" in obj && typeof (obj as any).id === "string";
    }

    if (!hasIdProperty(emailData)) {
      console.error("No email ID in response:", emailData);
      const errorResponse = createErrorResponse(ERROR_MESSAGES.NO_EMAIL_ID, 500, "NO_EMAIL_ID");
      Object.entries(responseHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }
    
    // Log email tracking information
    const trackingInfo = {
      emailId: emailData.id as string,
      customerEmail,
      customerName: sanitizedCustomerName,
      trackingId,
      managerName: sanitizedManagerName,
      businessName: sanitizedBusinessName,
      timestamp: new Date().toISOString(),
      status: "sent",
      clientIP,
      userAgent: req.headers.get("user-agent") || "unknown"
    };
    
    console.log("Email tracking info:", trackingInfo);
    
    console.log("Review email sent successfully:", {
      customerEmail,
      customerName: sanitizedCustomerName,
      trackingId,
      managerName: sanitizedManagerName,
      emailId: emailData.id as string,
      emailDomain,
      emailFromName,
      businessName: sanitizedBusinessName
    });

    // Create standardized success response
    const successResponse = new Response(
      JSON.stringify({
        success: true,
        data: {
          id: emailData.id as string,
          recipient: customerEmail,
          customerName: sanitizedCustomerName,
          trackingId,
          template: emailTemplate,
          primaryColor,
          buttonText,
          emailTitle
        },
        message: "Review email sent successfully",
        timestamp: new Date().toISOString(),
        retryAttempts: 1 // Will be updated if retries were used
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...responseHeaders,
        },
      }
    );
    
    return successResponse;
  } catch (error: unknown) {
    console.error("Unexpected error in send-review-email:", error);
    const errorResponse = createErrorResponse(ERROR_MESSAGES.UNEXPECTED_ERROR, 500, "UNEXPECTED_ERROR");
    Object.entries(responseHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
};

serve(handler);
