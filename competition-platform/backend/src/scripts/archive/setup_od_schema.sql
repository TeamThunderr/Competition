-- OD Workflow Schema Updates

-- 1. Enable Extensions
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update 'teams' table with Verification Columns AND New Details
ALTER TABLE teams 
-- 2. Update 'teams' table with Verification Columns AND New Details
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS proof_urls TEXT[], -- Array of strings
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS leader_name TEXT,
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS academic_year TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS members_info JSONB; -- Stores [{name, reg_no}, ...]

-- 3. Update 'od_requests' table
ALTER TABLE od_requests 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS from_date DATE,
ADD COLUMN IF NOT EXISTS to_date DATE;

-- 4. RLS Policies (Reference)
-- Ensure 'teams' is updatable by authenticated users for specific columns
-- create policy "Allow leader to upload proof" on teams for update using (auth.uid() = leader_id);
