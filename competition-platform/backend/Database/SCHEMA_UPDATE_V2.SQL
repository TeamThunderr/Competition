-- Gmail Sync V2 Schema Updates
-- Add required fields for admin-controlled start time and faculty-controlled sync

-- 1. Add uploaded_at and last_synced_at to competitions table
ALTER TABLE competitions 
ADD COLUMN uploaded_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN last_synced_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Update existing competitions to have uploaded_at = created_at
UPDATE competitions 
SET uploaded_at = created_at 
WHERE uploaded_at IS NULL;

-- 3. Make uploaded_at NOT NULL after setting default values
ALTER TABLE competitions 
ALTER COLUMN uploaded_at SET NOT NULL;

-- 4. Add index for efficient timestamp queries
CREATE INDEX idx_competitions_sync_timestamps ON competitions(uploaded_at, last_synced_at);

-- 5. Add index for efficient Gmail sync queries
CREATE INDEX idx_registrations_competition_user ON registrations(competition_id, user_id);
CREATE INDEX idx_competition_status_lookup ON competition_status(competition_id, user_id);

-- 6. Add comments for clarity
COMMENT ON COLUMN competitions.uploaded_at IS 'Timestamp when admin uploaded/created the competition. Used as Gmail sync start point.';
COMMENT ON COLUMN competitions.last_synced_at IS 'Timestamp of last Gmail sync. NULL means never synced. Used for incremental sync.';

-- 7. Ensure data integrity - registrations table should NOT have status column
-- (This is already correct in the current schema)

-- 8. Add constraint to ensure competition_status logic integrity
-- Ensure that if is_winner = true, then is_shortlisted must also be true
ALTER TABLE competition_status 
ADD CONSTRAINT check_winner_implies_shortlisted 
CHECK (NOT is_winner OR is_shortlisted);