import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GenerateReviewUrlRequest {
  tenant_id: string;
  business_name: string;
  google_review_url: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

interface GenerateReviewUrlResponse {
  success: boolean;
  slug?: string;
  review_url?: string;
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
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const baseDomain = Deno.env.get('BASE_DOMAIN') || 'https://yourapp.com';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { tenant_id, business_name, google_review_url, branding }: GenerateReviewUrlRequest = await req.json();

    // Validate required fields
    if (!tenant_id || !business_name || !google_review_url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: tenant_id, business_name, and google_review_url are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate Google review URL format
    const googleUrlPattern = /^https:\/\/(www\.)?google\.com\/search\?.*q=.*|^https:\/\/(www\.)?maps\.google\.com\/.*|^https:\/\/g\.co\/.*|^https:\/\/goo\.gl\/.*/;
    if (!googleUrlPattern.test(google_review_url)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Google review URL format. Please provide a valid Google Maps or Google search URL.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if tenant exists and user has permission
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, status')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tenant not found or access denied' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (tenant.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tenant is not active' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate slug using the database function
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_slug', { business_name });

    if (slugError || !slugData) {
      console.error('Error generating slug:', slugError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate unique slug' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const slug = slugData as string;
    const review_url = `${baseDomain}/review/${slug}`;

    // Update tenant with new information
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        business_name: business_name.trim(),
        google_review_url: google_review_url.trim(),
        slug,
        review_url,
        branding: branding || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', tenant_id);

    if (updateError) {
      console.error('Error updating tenant:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update tenant with review URL' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log the action for audit purposes
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id,
        action: 'generate_review_url',
        resource_type: 'tenant',
        resource_id: tenant_id,
        details: {
          business_name,
          slug,
          review_url,
          branding
        }
      });

    const response: GenerateReviewUrlResponse = {
      success: true,
      slug,
      review_url
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-review-url function:', error);
    
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
