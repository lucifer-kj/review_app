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

// Generate a unique tracking ID for this email
const generateTrackingId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, managerName = "Alpha Business Designs" }: ReviewEmailRequest = await req.json();

    // Get the current domain from the request
    const origin = req.headers.get('origin') || 'https://your-domain.com';
    const reviewFormUrl = `${origin}/review`;
    const trackingId = generateTrackingId();

    // Create embedded HTML form with conditional redirect logic
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Share Your Experience</title>
        <style>
          .rating-stars { display: flex; gap: 5px; justify-content: center; margin: 20px 0; }
          .star { font-size: 24px; color: #ddd; cursor: pointer; transition: color 0.2s; }
          .star:hover, .star.active { color: #ffc107; }
          .form-field { margin-bottom: 15px; }
          .form-label { display: block; margin-bottom: 5px; font-weight: 600; color: #374151; }
          .form-input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
          .form-button { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
          .form-button:hover { background: #1d4ed8; }
          .hidden { display: none; }
          .success-message { background: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center; }
          .google-review { background: #fef3c7; color: #92400e; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center; }
          .google-review a { background: #f59e0b; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-top: 10px; }
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">${managerName}</h1>
          <p style="color: #666; font-size: 18px;">We'd love to hear about your experience!</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin-bottom: 15px;">Share Your Feedback</h2>
          <p style="margin-bottom: 20px;">
            Your opinion matters to us! Please take a moment to share your experience with our services.
          </p>
          
          <!-- Embedded Review Form -->
          <form id="reviewForm" style="max-width: 400px; margin: 0 auto;">
            <input type="hidden" name="trackingId" value="${trackingId}" />
            <input type="hidden" name="managerName" value="${managerName}" />
            
            <div class="form-field">
              <label class="form-label" for="customerName">Your Name *</label>
              <input type="text" id="customerName" name="name" class="form-input" required placeholder="Enter your full name" />
            </div>
            
            <div class="form-field">
              <label class="form-label" for="customerPhone">Phone Number *</label>
              <input type="tel" id="customerPhone" name="phone" class="form-input" required placeholder="1234567890" />
            </div>
            
            <div class="form-field">
              <label class="form-label">How would you rate your experience? *</label>
              <div class="rating-stars">
                <span class="star" data-rating="1">★</span>
                <span class="star" data-rating="2">★</span>
                <span class="star" data-rating="3">★</span>
                <span class="star" data-rating="4">★</span>
                <span class="star" data-rating="5">★</span>
              </div>
              <input type="hidden" id="rating" name="rating" required />
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <button type="submit" class="form-button">Submit Review</button>
            </div>
          </form>
          
          <!-- Thank you message (hidden initially) -->
          <div id="thankYouMessage" class="hidden success-message">
            <h3 style="margin-bottom: 10px;">Thank you for your feedback! 🎉</h3>
            <p>Your review has been submitted successfully.</p>
          </div>
          
          <!-- Google Review redirect (hidden initially) -->
          <div id="googleReviewRedirect" class="hidden google-review">
            <h3 style="margin-bottom: 10px;">Great rating! 🎉</h3>
            <p style="margin-bottom: 10px;">Would you like to share this on Google Reviews too?</p>
            <a href="https://g.page/r/CZEmfT3kD-k-EBM/review" target="_blank">
              Leave Google Review
            </a>
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          <p>Thank you for choosing ${managerName}!</p>
          <p style="margin-top: 20px;">
            <em>This review form takes less than 1 minute to complete.</em>
          </p>
        </div>

        <script>
          // Star rating functionality
          const stars = document.querySelectorAll('.star');
          const ratingInput = document.getElementById('rating');
          
          stars.forEach((star, index) => {
            star.addEventListener('click', () => {
              const rating = index + 1;
              ratingInput.value = rating;
              
              stars.forEach((s, i) => {
                s.classList.toggle('active', i < rating);
              });
            });
            
            star.addEventListener('mouseenter', () => {
              stars.forEach((s, i) => {
                s.classList.toggle('active', i <= index);
              });
            });
          });
          
          document.querySelector('.rating-stars').addEventListener('mouseleave', () => {
            const currentRating = parseInt(ratingInput.value) || 0;
            stars.forEach((s, i) => {
              s.classList.toggle('active', i < currentRating);
            });
          });
          
          // Form submission
          document.getElementById('reviewForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.countryCode = '+1';
            
            try {
              const response = await fetch('${Deno.env.get("SUPABASE_URL")}/functions/v1/submit-review', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}',
                },
                body: JSON.stringify(data)
              });
              
              if (response.ok) {
                document.getElementById('reviewForm').style.display = 'none';
                document.getElementById('thankYouMessage').classList.remove('hidden');
                
                if (parseInt(data.rating) >= 4) {
                  setTimeout(() => {
                    document.getElementById('googleReviewRedirect').classList.remove('hidden');
                  }, 2000);
                }
              } else {
                alert('There was an error submitting your review. Please try again.');
              }
            } catch (error) {
              console.error('Error:', error);
              alert('There was an error submitting your review. Please try again.');
            }
          });
        </script>
      </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Alpha Business <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: "We'd love your feedback!",
      html: emailHtml,
    });

    console.log("Review email sent successfully:", emailResponse);
    console.log("Tracking ID:", trackingId);

    return new Response(JSON.stringify({
      ...emailResponse,
      trackingId,
      message: "Email sent successfully with embedded form"
    }), {
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