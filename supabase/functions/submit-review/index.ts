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

const getCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});

// Simple in-memory rate limiting per IP
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

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
  const origin = req.headers.get("Origin") || "*";
  
  // Define allowed origins - include your Vercel domain
  const allowedOrigins = [
    "https://invoice-app-iota-livid.vercel.app",
    "https://alpha-business.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173"
  ];
  
  // Check if origin is allowed
  const isOriginAllowed = allowedOrigins.includes(origin) || origin === "*";
  const corsHeaders = getCorsHeaders(isOriginAllowed ? origin : allowedOrigins[0]);

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!isOriginAllowed) {
    return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Rate limit
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const existing = rateLimitStore.get(ip);
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  } else {
    existing.count += 1;
    if (existing.count > RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  try {
    const body = await req.json();
    const { name, phone, countryCode, rating, trackingId, managerName, sig, ts }: ReviewSubmission & { sig?: string; ts?: string } = body;

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

    // Optional: verify HMAC signature for prefilled one-tap links
    if (sig && ts) {
      try {
        const secret = Deno.env.get("REVIEW_LINK_SECRET") || "";
        if (secret) {
          const enc = new TextEncoder();
          const key = await crypto.subtle.importKey(
            "raw",
            enc.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
          );
          const payload = `name=${name}&phone=${phone}&countryCode=${countryCode}&rating=${rating}&trackingId=${trackingId || ""}&ts=${ts}`;
          const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0));
          const verified = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
          if (!verified) {
            console.warn("Invalid signature for review submission");
          }
        }
      } catch (e) {
        console.warn("Signature verification failed:", e);
      }
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
