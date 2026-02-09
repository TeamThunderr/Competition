-- Create competition_status table
CREATE TABLE IF NOT EXISTS public.competition_status (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    competition_id uuid NOT NULL,
    is_shortlisted boolean DEFAULT false,
    is_winner boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT competition_status_pkey PRIMARY KEY (id),
    CONSTRAINT competition_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT competition_status_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES public.competitions(id),
    CONSTRAINT competition_status_user_competition_unique UNIQUE (user_id, competition_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_competition_status_user_id ON public.competition_status(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_status_competition_id ON public.competition_status(competition_id);
