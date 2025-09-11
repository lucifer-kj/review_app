import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PublicReviewSubmission {
  slug: string;
  reviewer_name?: string;
  reviewer_email?: string;
  reviewer_phone?: string;
  rating: number;
  feedback_text?: string;
  metadata?: {
    source?: string;
    user_agent?: string;
    ip_address?: string;
    referrer?: string;
  };
}

interface PublicReviewResponse {
  success: boolean;
  review_id?: string;
  redirect_url?: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize Supabase client with anon key for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const baseDomain = Deno.env.get('BASE_DOMAIN') || 'https://yourapp.com';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse request body
    const { 
      slug, 
      reviewer_name, 
      reviewer_email, 
      reviewer_phone, 
      rating, 
      feedback_text,
      metadata 
    }: PublicReviewSubmission = await req.json();

    // Validate required fields
    if (!slug || !rating) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: slug and rating are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rating must be an integer between 1 and 5' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get tenant by slug
    const { data: tenantData, error: tenantError } = await supabase
      .rpc('get_tenant_by_slug', { slug_param: slug });

    if (tenantError || !tenantData || tenantData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Business not found or review form not available' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const tenant = tenantData[0];

    // Prepare review data
    const reviewData = {
      tenant_id: tenant.id,
      reviewer_name: reviewer_name?.trim() || null,
      reviewer_email: reviewer_email?.trim() || null,
      reviewer_phone: reviewer_phone?.trim() || null,
      rating,
      feedback_text: feedback_text?.trim() || null,
      is_anonymous: true,
      source: 'public_form',
      metadata: {
        ...metadata,
        submitted_at: new Date().toISOString(),
        tenant_slug: slug
      }
    };

    // Insert review
    const { data: reviewResult, error: reviewError } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select('id')
      .single();

    if (reviewError || !reviewResult) {
      console.error('Error inserting review:', reviewError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to submit review' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const reviewId = reviewResult.id;

    // Determine redirect URL based on rating
    let redirectUrl: string;
    
    if (rating >= 4) {
      // High rating - redirect to Google Reviews
      redirectUrl = tenant.google_review_url;
    } else {
      // Low rating - redirect to internal feedback form
      redirectUrl = `${baseDomain}/feedback?review_id=${reviewId}&name=${encodeURIComponent(reviewer_name || 'Anonymous')}&rating=${rating}`;
    }

    const response: PublicReviewResponse = {
      success: true,
      review_id: reviewId,
      redirect_url: redirectUrl
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in submit-public-review function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
