-- Add status column to registrations table
ALTER TABLE registrations
ADD COLUMN status TEXT DEFAULT 'REGISTERED';

-- Add a check constraint to ensure only allowed values are used (optional but recommended)
-- ALTER TABLE registrations
-- ADD CONSTRAINT check_status CHECK (status IN ('REGISTERED', 'QUALIFIED', 'WON', 'REJECTED', 'PENDING'));
