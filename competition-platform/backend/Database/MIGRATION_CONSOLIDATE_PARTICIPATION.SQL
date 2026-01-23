-- =====================================================
-- MIGRATION: Consolidate participation → registrations
-- Run this in Supabase SQL Editor
-- =====================================================
-- 
-- WHAT THIS DOES:
-- 1. Adds missing Gmail-sync columns to registrations
-- 2. Migrates unique participation data → registrations
-- 3. Drops the participation table
--
-- ⚠️  BACKUP YOUR DATA BEFORE RUNNING!
-- =====================================================

-- STEP 1: First, let's see what we're working with
-- Run these SELECT statements first to understand your data

-- Check participation count
SELECT 'participation' as table_name, COUNT(*) as row_count FROM participation
UNION ALL
SELECT 'registrations' as table_name, COUNT(*) as row_count FROM registrations;

-- Check for overlapping records (same student + competition in both tables)
SELECT 
    p.student_id,
    p.competition_id,
    'EXISTS IN BOTH' as status
FROM participation p
INNER JOIN registrations r 
    ON p.student_id = r.user_id 
    AND p.competition_id = r.competition_id
LIMIT 20;

-- =====================================================
-- STEP 2: Add missing columns to registrations
-- (These are the Gmail-sync specific fields from participation)
-- =====================================================

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS gmail_message_id text,
ADD COLUMN IF NOT EXISTS matched_keyword text,
ADD COLUMN IF NOT EXISTS confidence_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS remarks text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- =====================================================
-- STEP 3: Migrate participation data → registrations
-- Only inserts records that DON'T already exist in registrations
-- =====================================================

-- First, let's check what enum values exist for the source column
-- Run this to see valid values:
SELECT DISTINCT source FROM registrations WHERE source IS NOT NULL;

-- Also check participation sources:
SELECT DISTINCT verification_source FROM participation WHERE verification_source IS NOT NULL;

-- Now run the migration:
INSERT INTO registrations (
    user_id,
    competition_id,
    source,
    verified,
    verified_by,
    registered_at,
    status,
    gmail_message_id,
    matched_keyword,
    confidence_score,
    last_synced_at,
    remarks
)
SELECT 
    p.student_id as user_id,
    p.competition_id,
    'AUTO_GMAIL' as source,  -- Using text, Supabase will handle conversion
    CASE 
        WHEN p.verified_by IS NOT NULL THEN true 
        ELSE false 
    END as verified,
    p.verified_by,
    p.created_at as registered_at,
    CASE 
        WHEN p.status::text = 'REGISTERED' THEN 'REGISTERED'
        WHEN p.status::text = 'COMPLETED' THEN 'COMPLETED'
        ELSE 'REGISTERED'
    END as status,
    p.gmail_message_id,
    p.matched_keyword,
    p.confidence_score,
    p.last_synced_at,
    p.remarks
FROM participation p
WHERE NOT EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.user_id = p.student_id 
    AND r.competition_id = p.competition_id
);

-- =====================================================
-- STEP 4: Verify the migration worked
-- =====================================================

-- Check new registrations count (should be higher)
SELECT 'registrations (after migration)' as table_name, COUNT(*) as row_count 
FROM registrations;

-- Check for any records with Gmail data
SELECT COUNT(*) as gmail_synced_records 
FROM registrations 
WHERE gmail_message_id IS NOT NULL;

-- =====================================================
-- STEP 5: Drop the participation table
-- ⚠️  ONLY RUN THIS AFTER VERIFYING STEP 4!
-- =====================================================

-- Uncomment below to drop the table:
-- DROP TABLE IF EXISTS participation;

-- =====================================================
-- OPTIONAL: Create index for Gmail lookups
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_registrations_gmail_id 
ON registrations(gmail_message_id) 
WHERE gmail_message_id IS NOT NULL;

-- =====================================================
-- DONE! 
-- 
-- After running this:
-- 1. Update gmailToRegistration.service.js to write to 'registrations' table
-- 2. Remove any code that reads from 'participation' table
-- 3. Delete the participation table constraints and the table itself
-- =====================================================
