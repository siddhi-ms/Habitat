// Supabase Edge Function to send emergency email
// Deploy this to Supabase: supabase functions deploy send-emergency-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, projectName, projectId, emergencyType, location, species } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Email content
    const subject = `🚨 EMERGENCY ALERT: ${emergencyType} Detected - ${projectName}`
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 EMERGENCY ALERT</h1>
            </div>
            <div class="content">
              <div class="alert">
                <h2 style="margin-top: 0; color: #dc2626;">${emergencyType} Emergency Detected</h2>
                <p><strong>Project:</strong> ${projectName}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Species:</strong> ${species}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>Your restoration project has been flagged with a <strong>${emergencyType}</strong> emergency. Immediate action may be required.</p>
              <p>Please review your project dashboard and take necessary precautions to protect your saplings.</p>
              <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/project/${projectId}" class="button">View Project Details</a>
            </div>
            <div class="footer">
              <p>This is an automated alert from Prithvi Restoration Platform</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Use Resend or SendGrid for email (recommended)
    // For now, we'll use Supabase's built-in email via Auth API (limited)
    // Or use a service like Resend
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (RESEND_API_KEY) {
      // Use Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM_EMAIL') || 'alerts@prithvi.app',
          to: email,
          subject: subject,
          html: htmlContent,
        }),
      })

      if (!resendResponse.ok) {
        throw new Error('Failed to send email via Resend')
      }
    } else {
      // Fallback: Store in database for webhook/trigger to send email
      const { error } = await supabase
        .from('emergency_notifications')
        .insert([{
          email: email,
          project_id: projectId,
          project_name: projectName,
          emergency_type: emergencyType,
          location: location,
          species: species,
          status: 'pending',
          created_at: new Date().toISOString(),
        }])

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Emergency email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
