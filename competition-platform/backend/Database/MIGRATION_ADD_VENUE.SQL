-- Add venue column to competitions table
ALTER TABLE public.competitions 
ADD COLUMN IF NOT EXISTS venue text;

-- Comment on column
COMMENT ON COLUMN public.competitions.venue IS 'Physical venue for the competition (if applicable)';
