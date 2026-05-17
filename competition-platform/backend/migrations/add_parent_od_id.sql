-- Migration: Add OD Extension Support
-- Description: Adds columns to support OD extension functionality

-- Add parent_od_id to track which OD is being extended
ALTER TABLE od_requests 
ADD COLUMN IF NOT EXISTS parent_od_id uuid REFERENCES od_requests(id) ON DELETE SET NULL;

-- Add is_extension flag for quick filtering
ALTER TABLE od_requests 
ADD COLUMN IF NOT EXISTS is_extension boolean DEFAULT false;

-- Add extension_count to track how many times an OD has been extended
ALTER TABLE od_requests 
ADD COLUMN IF NOT EXISTS extension_count integer DEFAULT 0;

-- Add original_from_date to preserve the original start date
ALTER TABLE od_requests 
ADD COLUMN IF NOT EXISTS original_from_date date;

-- Add competitions_info to store multiple competition details for merged ODs
ALTER TABLE od_requests 
ADD COLUMN IF NOT EXISTS competitions_info jsonb DEFAULT '[]'::jsonb;

-- Create index for faster parent_od_id lookups
CREATE INDEX IF NOT EXISTS idx_od_requests_parent_od_id ON od_requests(parent_od_id);

-- Create index for extension filtering
CREATE INDEX IF NOT EXISTS idx_od_requests_is_extension ON od_requests(is_extension);

COMMENT ON COLUMN od_requests.parent_od_id IS 'References the original OD that this extends (for tracking history)';
COMMENT ON COLUMN od_requests.is_extension IS 'True if this OD has been extended from a previous OD';
COMMENT ON COLUMN od_requests.extension_count IS 'Number of times this OD has been extended';
COMMENT ON COLUMN od_requests.original_from_date IS 'Original start date before any extensions';
COMMENT ON COLUMN od_requests.competitions_info IS 'Array of competition details for merged ODs: [{competition_id, title, from_date, to_date}]';
