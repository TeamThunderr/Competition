-- =====================================================
-- SCHEMA UPDATE: Gmail Sync Improvements
-- Run in Supabase SQL Editor
-- =====================================================

-- 1. Add Sync Lock & Status fields to competitions table
ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS is_syncing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_sync_from timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_sync_to timestamp with time zone,
ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'never', -- never, success, failed, partial
ADD COLUMN IF NOT EXISTS sync_error_message text,
ADD COLUMN IF NOT EXISTS sync_started_by uuid;

-- Add index for sync lock checks
CREATE INDEX IF NOT EXISTS idx_competitions_syncing ON competitions(is_syncing) WHERE is_syncing = true;

-- 2. Add deduplication constraint to registrations (gmail_message_id)
-- First, remove any duplicate gmail_message_ids (keep latest)
-- This is safe because gmail_message_id can be null for manual registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_gmail_unique 
ON registrations(gmail_message_id) 
WHERE gmail_message_id IS NOT NULL;

-- 3. Optional: Keywords versioning (for future use)
-- ALTER TABLE competitions ADD COLUMN IF NOT EXISTS keyword_version integer DEFAULT 1;
-- ALTER TABLE registrations ADD COLUMN IF NOT EXISTS matched_keyword_version integer;

-- =====================================================
-- DONE! Now update the backend code to use these fields
-- =====================================================
