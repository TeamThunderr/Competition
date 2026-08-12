-- Production Gmail sync queue infrastructure.
-- Run this once against Supabase Postgres before deploying the backend changes.

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS sync_progress text;

CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.users(id),
  scope_department_id uuid REFERENCES public.departments(id),
  scope_sections text[] NOT NULL DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'PAUSED_RATE_LIMIT', 'CANCELLED')),
  started_at timestamptz,
  completed_at timestamptz,
  last_heartbeat_at timestamptz,
  total_students integer NOT NULL DEFAULT 0,
  students_processed integer NOT NULL DEFAULT 0,
  emails_found integer NOT NULL DEFAULT 0,
  emails_processed integer NOT NULL DEFAULT 0,
  competitions_updated integer NOT NULL DEFAULT 0,
  registrations_updated integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  pg_boss_job_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON public.sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_competition_created ON public.sync_jobs(competition_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_requested_by_created ON public.sync_jobs(requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_heartbeat ON public.sync_jobs(status, last_heartbeat_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_jobs_one_active_per_competition
  ON public.sync_jobs(competition_id)
  WHERE status IN ('QUEUED', 'PROCESSING', 'PAUSED_RATE_LIMIT');

CREATE TABLE IF NOT EXISTS public.registrations_dedupe_archive AS
SELECT * FROM public.registrations WHERE false;

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, competition_id
           ORDER BY updated_at DESC NULLS LAST, registered_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.registrations
  WHERE user_id IS NOT NULL AND competition_id IS NOT NULL
),
duplicates AS (
  SELECT id FROM ranked WHERE rn > 1
)
INSERT INTO public.registrations_dedupe_archive
SELECT r.* FROM public.registrations r
JOIN duplicates d ON d.id = r.id
ON CONFLICT DO NOTHING;

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, competition_id
           ORDER BY updated_at DESC NULLS LAST, registered_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.registrations
  WHERE user_id IS NOT NULL AND competition_id IS NOT NULL
)
DELETE FROM public.registrations r
USING ranked
WHERE r.id = ranked.id AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_user_competition_unique
  ON public.registrations(user_id, competition_id);

CREATE TABLE IF NOT EXISTS public.competition_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  is_shortlisted boolean NOT NULL DEFAULT false,
  is_winner boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competition_status_dedupe_archive AS
SELECT * FROM public.competition_status WHERE false;

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, competition_id
           ORDER BY updated_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.competition_status
),
duplicates AS (
  SELECT id FROM ranked WHERE rn > 1
)
INSERT INTO public.competition_status_dedupe_archive
SELECT cs.* FROM public.competition_status cs
JOIN duplicates d ON d.id = cs.id
ON CONFLICT DO NOTHING;

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, competition_id
           ORDER BY updated_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.competition_status
)
DELETE FROM public.competition_status cs
USING ranked
WHERE cs.id = ranked.id AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_competition_status_user_competition_unique
  ON public.competition_status(user_id, competition_id);

CREATE INDEX IF NOT EXISTS idx_users_department_role_section
  ON public.users(department_id, role, section);
CREATE INDEX IF NOT EXISTS idx_registrations_competition_user
  ON public.registrations(competition_id, user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_verified
  ON public.registrations(user_id, verified);
CREATE INDEX IF NOT EXISTS idx_email_buffer_competition_status
  ON public.email_ingestion_buffer(competition_id, status);
CREATE INDEX IF NOT EXISTS idx_competitions_deadline
  ON public.competitions(registration_deadline);

CREATE OR REPLACE FUNCTION public.create_gmail_sync_job(
  p_competition_id uuid,
  p_requested_by uuid,
  p_scope_department_id uuid,
  p_scope_sections text[]
)
RETURNS TABLE(job_id uuid, already_running boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_job_id uuid;
  new_job_id uuid;
  locked_competition public.competitions%ROWTYPE;
BEGIN
  SELECT *
  INTO locked_competition
  FROM public.competitions
  WHERE id = p_competition_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  SELECT id
  INTO existing_job_id
  FROM public.sync_jobs
  WHERE competition_id = p_competition_id
    AND status IN ('QUEUED', 'PROCESSING', 'PAUSED_RATE_LIMIT')
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_job_id IS NOT NULL OR COALESCE(locked_competition.is_syncing, false) THEN
    RETURN QUERY SELECT existing_job_id, true, 'Synchronization is already in progress.';
    RETURN;
  END IF;

  INSERT INTO public.sync_jobs (
    competition_id,
    requested_by,
    scope_department_id,
    scope_sections,
    status,
    last_heartbeat_at
  )
  VALUES (
    p_competition_id,
    p_requested_by,
    p_scope_department_id,
    COALESCE(p_scope_sections, ARRAY[]::text[]),
    'QUEUED',
    now()
  )
  RETURNING id INTO new_job_id;

  UPDATE public.competitions
  SET is_syncing = true,
      sync_status = 'queued',
      sync_progress = 'Sync queued',
      sync_started_by = p_requested_by,
      sync_error_message = NULL
  WHERE id = p_competition_id;

  RETURN QUERY SELECT new_job_id, false, 'Sync queued.';
END;
$$;
