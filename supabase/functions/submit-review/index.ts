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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_ANON_KEY")
);

interface ReviewSubmission {
  name: string;
  phone: string;
  countryCode: string;
  rating: number;
  trackingId?: string;
  managerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("", { 
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      }
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { name, phone, countryCode, rating, trackingId, managerName }: ReviewSubmission = body;

    // Validate required fields
    if (!name || !phone || !rating) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate rating is between 1-5
    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return new Response(
        JSON.stringify({ error: "Rating must be between 1 and 5" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get tenant context from request (could be from URL params, headers, or other means)
    // For now, we'll use a default tenant or allow tenant_id to be passed
    let tenantId = null;

    // Try to get tenant_id from request body or URL params
    if (body.tenantId) {
      tenantId = body.tenantId;
    }

    // Save review to database
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        country_code: countryCode || '+1',
        rating: ratingNum,
        google_review: ratingNum >= 4,
        redirect_opened: false,
        tenant_id: tenantId, // Include tenant context
        metadata: {
          trackingId,
          managerName,
          source: 'email_form',
          submitted_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log("Review submitted:", {
      id: data.id,
      name: data.name,
      rating: data.rating,
      trackingId,
      managerName
    });

    return new Response(JSON.stringify({ 
      success: true, 
      reviewId: data.id,
      message: "Review submitted successfully",
      rating: data.rating,
      willShowGoogleReview: data.rating >= 4
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: unknown) {
    console.error("Error submitting review:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit review"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};

serve(handler);
