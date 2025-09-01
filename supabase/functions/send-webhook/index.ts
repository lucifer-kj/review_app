import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookRequest {
  email: string;
  webhookUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, webhookUrl }: WebhookRequest = await req.json();

    // Default webhook URL or use environment variable
    const defaultWebhookUrl = Deno.env.get("WEBHOOK_URL") || "https://webhook.site/unique-url";
    const targetUrl = webhookUrl || defaultWebhookUrl;

    console.log(`Sending email ${email} to webhook: ${targetUrl}`);

    // Send email to webhook
    const webhookResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        timestamp: new Date().toISOString(),
        source: "alpha-business-app"
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook request failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
    }

    const webhookResult = await webhookResponse.text();
    console.log("Webhook response:", webhookResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email successfully sent to webhook",
        webhook_url: targetUrl,
        email: email
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-webhook function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);