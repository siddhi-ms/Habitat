# Emergency Email Function

This Supabase Edge Function sends emergency emails when drought or other critical conditions are detected.

## Setup

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Deploy the function**:
   ```bash
   supabase functions deploy send-emergency-email
   ```

4. **Set environment variables** in Supabase Dashboard → Edge Functions → send-emergency-email:
   - `RESEND_API_KEY` (optional, for Resend email service)
   - `RESEND_FROM_EMAIL` (optional, e.g., alerts@yourdomain.com)
   - `NEXT_PUBLIC_APP_URL` (your frontend URL, e.g., https://yourdomain.com)

## Email Service Options

### Option 1: Resend (Recommended)
1. Sign up at https://resend.com
2. Get your API key
3. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Supabase Edge Function secrets

### Option 2: Database Trigger (Fallback)
If you don't set up Resend, the function will store notifications in `emergency_notifications` table.
You can then set up a database trigger/webhook to send emails via your preferred service.

## Database Table (if using fallback)

Create this table in Supabase:

```sql
CREATE TABLE emergency_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  project_name TEXT,
  emergency_type TEXT,
  location TEXT,
  species TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
