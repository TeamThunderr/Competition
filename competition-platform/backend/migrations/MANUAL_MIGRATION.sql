-- ============================================
-- OD EXTENSION MIGRATION - COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- ============================================

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

-- ============================================
-- VERIFICATION QUERY (Run this after the above)
-- ============================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'od_requests'
-- AND column_name IN ('parent_od_id', 'is_extension', 'extension_count', 'original_from_date', 'competitions_info')
-- ORDER BY column_name;
