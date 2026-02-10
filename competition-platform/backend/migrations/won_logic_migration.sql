-- ============================================
-- WON LOGIC MIGRATION (REFINED) - COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- ============================================

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS won_status text DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS winning_proof_url text,
ADD COLUMN IF NOT EXISTS winning_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS winning_verified_by uuid REFERENCES users(id);

-- Optional: Add index for won_status if searching by it becomes common
CREATE INDEX IF NOT EXISTS idx_registrations_won_status ON registrations(won_status);
CREATE INDEX IF NOT EXISTS idx_registrations_winning_verified ON registrations(winning_verified);
