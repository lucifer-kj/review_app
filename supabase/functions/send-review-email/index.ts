import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewEmailRequest {
  recipientEmail: string;
  managerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, managerName = "Alpha Business Designs" }: ReviewEmailRequest = await req.json();

    const reviewFormUrl = `${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://")?.replace(".supabase.co", ".lovable.app")}/`;

    const emailResponse = await resend.emails.send({
      from: "Alpha Business <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: "We'd love your feedback!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Share Your Experience</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Alpha Business Designs</h1>
            <p style="color: #666; font-size: 18px;">We'd love to hear about your experience!</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-bottom: 15px;">Share Your Feedback</h2>
            <p style="margin-bottom: 20px;">
              Your opinion matters to us! Please take a moment to share your experience with our services.
            </p>
            <p style="margin-bottom: 25px;">
              If you rate us 4 stars or higher, we'll redirect you to leave a Google review to help others find us too!
            </p>
            
            <div style="text-align: center;">
              <a href="${reviewFormUrl}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Leave Your Review
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Thank you for choosing ${managerName}!</p>
            <p style="margin-top: 20px;">
              <em>This review form takes less than 1 minute to complete.</em>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Review email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-review-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);