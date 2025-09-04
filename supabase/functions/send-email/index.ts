import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { to, subject, html, text, from }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to and subject' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid email format' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Get environment variables
    const emailService = Deno.env.get('EMAIL_SERVICE') || 'mailgun' // Options: mailgun, sendgrid, emailjs
    const apiKey = Deno.env.get('EMAIL_API_KEY')
    const domain = Deno.env.get('EMAIL_DOMAIN')
    const fromEmail = from || `noreply@${domain}`

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured' 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    let emailResponse: Response | null = null

    // Send email based on configured service
    switch (emailService.toLowerCase()) {
      case 'mailgun':
        emailResponse = await sendWithMailgun(to, subject, html || text || '', fromEmail, apiKey, domain)
        break
      case 'sendgrid':
        emailResponse = await sendWithSendGrid(to, subject, html || text || '', fromEmail, apiKey)
        break
      case 'emailjs':
        emailResponse = await sendWithEmailJS(to, subject, html || text || '', fromEmail, apiKey)
        break
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unsupported email service: ${emailService}` 
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
    }

    if (!emailResponse || !emailResponse.ok) {
      let errorMessage = 'Unknown error'
      try {
        if (emailResponse) {
          const errorData = await emailResponse.json()
          errorMessage = errorData.message || `HTTP ${emailResponse.status}`
        }
      } catch {
        if (emailResponse) {
          errorMessage = `HTTP ${emailResponse.status} ${emailResponse.statusText}`
        }
      }
      
      console.error(`${emailService} API error:`, errorMessage)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `${emailService} API error: ${errorMessage}` 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Log successful email send
    console.log(`Email sent successfully to ${to}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email sent successfully' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )

  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})

// Mailgun email sending
async function sendWithMailgun(to: string, subject: string, content: string, from: string, apiKey: string, domain: string): Promise<Response> {
  const formData = new FormData()
  formData.append('from', from)
  formData.append('to', to)
  formData.append('subject', subject)
  formData.append('html', content)

  return await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: formData,
  })
}

// SendGrid email sending
async function sendWithSendGrid(to: string, subject: string, content: string, from: string, apiKey: string): Promise<Response> {
  return await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject: subject,
      content: [
        {
          type: 'text/html',
          value: content,
        },
      ],
    }),
  })
}

// EmailJS API sending (alternative to client-side)
async function sendWithEmailJS(to: string, subject: string, content: string, from: string, apiKey: string): Promise<Response> {
  return await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: Deno.env.get('EMAILJS_SERVICE_ID'),
      template_id: Deno.env.get('EMAILJS_TEMPLATE_ID'),
      user_id: apiKey,
      template_params: {
        to_email: to,
        subject: subject,
        message: content,
        from_email: from,
      },
    }),
  })
}
