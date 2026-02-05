# Emergency SOS/Drought Button Setup Guide

## Overview

The SOS/Drought emergency button has been added to the project details page (`/project/[id]`). It:
- Appears **disabled (gray)** when no emergency is detected
- Turns **red and clickable** when an emergency is detected (drought risk = "High" or risk rating = "High")
- Sends an email to the logged-in user when clicked
- Shows "Email Sent" confirmation after successful send

## Emergency Detection Logic

The button becomes active (red) when:
- `prediction_result.warning_analytics.drought_risk_level === "High"` OR
- `prediction_result.risk_rating === "High"`

## Email Setup Options

### Option 1: Supabase Edge Function (Recommended)

1. **Deploy the Edge Function**:
   ```bash
   cd supabase/functions/send-emergency-email
   supabase functions deploy send-emergency-email
   ```

2. **Set Environment Variables** in Supabase Dashboard:
   - Go to: Edge Functions → send-emergency-email → Settings
   - Add secrets:
     - `RESEND_API_KEY` (get from https://resend.com)
     - `RESEND_FROM_EMAIL` (e.g., alerts@yourdomain.com)
     - `NEXT_PUBLIC_APP_URL` (your frontend URL)

3. **Sign up for Resend** (free tier available):
   - Visit https://resend.com
   - Create an account
   - Get your API key
   - Verify your domain (or use their test domain)

### Option 2: Database Fallback (No Email Service Required)

If you don't want to set up Resend/Edge Functions:

1. **Run the migration** to create the `emergency_notifications` table:
   ```sql
   -- Run this in Supabase SQL Editor
   CREATE TABLE IF NOT EXISTS emergency_notifications (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
     email TEXT NOT NULL,
     project_name TEXT,
     emergency_type TEXT NOT NULL DEFAULT 'Drought',
     location TEXT,
     species TEXT,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   ALTER TABLE emergency_notifications ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view their own emergency notifications"
     ON emergency_notifications FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own emergency notifications"
     ON emergency_notifications FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

2. **Set up a Database Webhook** (optional):
   - In Supabase Dashboard → Database → Webhooks
   - Create a webhook that triggers on `emergency_notifications` INSERT
   - Point it to your email service API (SendGrid, Mailgun, etc.)

## Testing

1. **Create a test project** with emergency conditions:
   - Deploy a project that triggers High drought risk
   - Or manually update `prediction_result` in database:
     ```sql
     UPDATE projects 
     SET prediction_result = jsonb_set(
       prediction_result, 
       '{warning_analytics,drought_risk_level}', 
       '"High"'
     )
     WHERE id = 'your-project-id';
     ```

2. **Visit the project page** - the button should be red and clickable

3. **Click the SOS button** - email should be sent (check your inbox)

## Troubleshooting

- **Button stays gray**: Check that `prediction_result` contains `warning_analytics.drought_risk_level = "High"` or `risk_rating = "High"`
- **Email not sending**: Check Supabase Edge Function logs in Dashboard
- **Edge Function not found**: Make sure you've deployed the function: `supabase functions deploy send-emergency-email`
- **Database error**: Make sure `emergency_notifications` table exists (run migration)

## Files Modified

- `app/project/[id]/page.tsx` - Added SOS button and emergency detection
- `supabase/functions/send-emergency-email/index.ts` - Edge Function for sending emails
- `supabase/migrations/create_emergency_notifications.sql` - Database table for fallback
