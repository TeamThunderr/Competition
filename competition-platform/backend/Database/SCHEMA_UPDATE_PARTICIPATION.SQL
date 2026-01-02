-- File Name: SCHEMA_UPDATE_PARTICIPATION.SQL
-- Purpose: Unified Participation table for Faculty-Driven Gmail Sync

-- Create Enum Types if they don't exist (handling potential conflicts if I run this multiple times in dev)

-- 1. Ensure users table has refresh token for Sync
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

DO $$ BEGIN
    CREATE TYPE participation_status AS ENUM ('NOT_REGISTERED', 'PENDING', 'REGISTERED', 'SHORTLISTED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_method AS ENUM ('AUTO_GMAIL', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    
    status participation_status DEFAULT 'NOT_REGISTERED',
    verification_source verification_method,
    verified_by UUID REFERENCES users(id),
    
    -- Gmail Sync Metadata
    gmail_message_id TEXT,
    matched_keyword TEXT,
    confidence_score INT DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    
    remarks TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (student_id, competition_id)
);

-- Index for fast filtering by competition and status
CREATE INDEX IF NOT EXISTS idx_participation_comp_status ON participation(competition_id, status);
CREATE INDEX IF NOT EXISTS idx_participation_student ON participation(student_id);
