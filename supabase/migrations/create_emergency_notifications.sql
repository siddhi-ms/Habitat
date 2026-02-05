-- Create emergency_notifications table for fallback email storage
-- This table is used if Edge Functions are not set up
-- You can set up a database trigger/webhook to send emails when rows are inserted

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE emergency_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own emergency notifications"
  ON emergency_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own notifications
CREATE POLICY "Users can insert their own emergency notifications"
  ON emergency_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_user_id ON emergency_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_status ON emergency_notifications(status);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_created_at ON emergency_notifications(created_at);
