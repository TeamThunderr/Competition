-- Competition discovery backend foundation.
-- Safe to run after production_gmail_sync_queue.sql.

ALTER TABLE public.email_ingestion_buffer
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'PARTICIPATION',
  ADD COLUMN IF NOT EXISTS mailbox_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS gmail_internal_date timestamptz,
  ADD COLUMN IF NOT EXISTS source_sender text,
  ADD COLUMN IF NOT EXISTS source_recipient text;

UPDATE public.email_ingestion_buffer
SET source_type = 'PARTICIPATION'
WHERE source_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_buffer_source_status
  ON public.email_ingestion_buffer(source_type, status);

CREATE INDEX IF NOT EXISTS idx_email_buffer_mailbox_source
  ON public.email_ingestion_buffer(mailbox_user_id, source_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_buffer_mailbox_message_source_unique
  ON public.email_ingestion_buffer(mailbox_user_id, gmail_message_id, source_type);

CREATE TABLE IF NOT EXISTS public.competition_discovery_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mailbox_email text NOT NULL,
  sender_filter text NOT NULL,
  last_successful_sync_at timestamptz,
  last_gmail_message_internal_date timestamptz,
  status text NOT NULL DEFAULT 'IDLE'
    CHECK (status IN ('IDLE', 'RUNNING', 'COMPLETED', 'FAILED')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mailbox_user_id, sender_filter)
);

CREATE TABLE IF NOT EXISTS public.competition_discovery_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'PAUSED_RATE_LIMIT', 'CANCELLED')),
  started_at timestamptz,
  completed_at timestamptz,
  last_heartbeat_at timestamptz,
  messages_found integer NOT NULL DEFAULT 0,
  messages_processed integer NOT NULL DEFAULT 0,
  candidates_created integer NOT NULL DEFAULT 0,
  duplicates_found integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  pg_boss_job_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competition_discovery_jobs_status
  ON public.competition_discovery_jobs(status);

CREATE INDEX IF NOT EXISTS idx_competition_discovery_jobs_mailbox_created
  ON public.competition_discovery_jobs(mailbox_user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_competition_discovery_one_active_per_mailbox
  ON public.competition_discovery_jobs(mailbox_user_id)
  WHERE status IN ('QUEUED', 'PROCESSING', 'PAUSED_RATE_LIMIT');

CREATE TABLE IF NOT EXISTS public.competition_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'PENDING_REVIEW'
    CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  title text NOT NULL,
  normalized_title text,
  organizer text,
  description text,
  category text,
  eligibility text,
  registration_deadline date,
  event_date date,
  mode text,
  venue text,
  external_link text,
  official_url text,
  contact_information text,
  confidence_score numeric,
  duplicate_of_competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  duplicate_of_candidate_id uuid REFERENCES public.competition_candidates(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'OFFICIAL_COMPETITION_EMAIL',
  source_message_id text NOT NULL,
  source_sender text NOT NULL,
  source_mailbox_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discovery_job_id uuid REFERENCES public.competition_discovery_jobs(id) ON DELETE SET NULL,
  ai_extracted_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competition_candidates_status_created
  ON public.competition_candidates(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competition_candidates_normalized_title
  ON public.competition_candidates(normalized_title);

CREATE UNIQUE INDEX IF NOT EXISTS idx_competition_candidates_source_message_unique
  ON public.competition_candidates(source_mailbox_user_id, source_message_id);

CREATE OR REPLACE FUNCTION public.create_competition_discovery_job(
  p_mailbox_user_id uuid,
  p_requested_by uuid,
  p_mailbox_email text,
  p_sender_filter text
)
RETURNS TABLE(job_id uuid, already_running boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_job_id uuid;
  new_job_id uuid;
BEGIN
  INSERT INTO public.competition_discovery_state (
    mailbox_user_id,
    mailbox_email,
    sender_filter,
    status
  )
  VALUES (
    p_mailbox_user_id,
    p_mailbox_email,
    p_sender_filter,
    'IDLE'
  )
  ON CONFLICT (mailbox_user_id, sender_filter)
  DO UPDATE SET mailbox_email = excluded.mailbox_email,
                updated_at = now();

  PERFORM 1
  FROM public.competition_discovery_state
  WHERE mailbox_user_id = p_mailbox_user_id
    AND sender_filter = p_sender_filter
  FOR UPDATE;

  SELECT id
  INTO existing_job_id
  FROM public.competition_discovery_jobs
  WHERE mailbox_user_id = p_mailbox_user_id
    AND status IN ('QUEUED', 'PROCESSING', 'PAUSED_RATE_LIMIT')
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    RETURN QUERY SELECT existing_job_id, true, 'Competition discovery is already in progress.';
    RETURN;
  END IF;

  INSERT INTO public.competition_discovery_jobs (
    mailbox_user_id,
    requested_by,
    status,
    last_heartbeat_at
  )
  VALUES (
    p_mailbox_user_id,
    p_requested_by,
    'QUEUED',
    now()
  )
  RETURNING id INTO new_job_id;

  UPDATE public.competition_discovery_state
  SET status = 'RUNNING',
      error_message = NULL,
      updated_at = now()
  WHERE mailbox_user_id = p_mailbox_user_id
    AND sender_filter = p_sender_filter;

  RETURN QUERY SELECT new_job_id, false, 'Competition discovery queued.';
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_competition_candidate(
  p_candidate_id uuid,
  p_reviewed_by uuid,
  p_title text,
  p_organizer text,
  p_description text,
  p_platform text,
  p_external_link text,
  p_registration_deadline date,
  p_event_date date,
  p_mode text,
  p_venue text,
  p_departments text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_competition_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.competition_candidates
    WHERE id = p_candidate_id AND status = 'APPROVED'
  ) THEN
    RAISE EXCEPTION 'Candidate is already approved';
  END IF;

  INSERT INTO public.competitions (
    title,
    organizer,
    description,
    platform,
    external_link,
    registration_deadline,
    event_date,
    mode,
    venue,
    departments,
    created_by
  )
  VALUES (
    p_title,
    p_organizer,
    p_description,
    p_platform,
    p_external_link,
    p_registration_deadline,
    p_event_date,
    p_mode,
    p_venue,
    COALESCE(p_departments, ARRAY['All']::text[]),
    p_reviewed_by
  )
  RETURNING id INTO new_competition_id;

  UPDATE public.competition_candidates
  SET status = 'APPROVED',
      competition_id = new_competition_id,
      reviewed_by = p_reviewed_by,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_candidate_id;

  RETURN new_competition_id;
END;
$$;

