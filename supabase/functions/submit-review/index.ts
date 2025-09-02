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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone, countryCode, rating, trackingId, managerName }: ReviewSubmission = await req.json();

    // Validate required fields
    if (!name || !phone || !rating) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
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
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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

    console.log("Review submitted from email:", {
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
        ...corsHeaders,
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
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
