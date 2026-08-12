-- Coding platform profile backend foundation.
-- Public-profile-only integration for LeetCode and CodeChef.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coding_platform') THEN
    CREATE TYPE public.coding_platform AS ENUM ('LEETCODE', 'CODECHEF');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coding_profile_sync_status') THEN
    CREATE TYPE public.coding_profile_sync_status AS ENUM ('PENDING', 'VALID', 'NOT_FOUND', 'UNAVAILABLE', 'PENDING_SYNC', 'ERROR');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coding_profile_source_type') THEN
    CREATE TYPE public.coding_profile_source_type AS ENUM ('PUBLIC_PROFILE', 'OFFICIAL_API', 'COMMUNITY_API', 'SCRAPING');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.student_coding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform public.coding_platform NOT NULL,
  username text NOT NULL,
  profile_url text,
  sync_status public.coding_profile_sync_status NOT NULL DEFAULT 'PENDING',
  last_synced_at timestamptz,
  last_sync_started_at timestamptz,
  last_sync_error text,
  verified_publicly boolean NOT NULL DEFAULT false,
  source_type public.coding_profile_source_type NOT NULL DEFAULT 'PUBLIC_PROFILE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, platform),
  UNIQUE(platform, username)
);

CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_student_platform
  ON public.student_coding_profiles(student_id, platform);

CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_platform_username
  ON public.student_coding_profiles(platform, username);

CREATE INDEX IF NOT EXISTS idx_student_coding_profiles_sync_status
  ON public.student_coding_profiles(sync_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.leetcode_profile_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_coding_profile_id uuid NOT NULL REFERENCES public.student_coding_profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  profile_url text,
  total_solved integer,
  easy_solved integer,
  medium_solved integer,
  hard_solved integer,
  ranking integer,
  reputation numeric,
  contest_rating numeric,
  contest_participation_count integer,
  badge_count integer,
  activity_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_type public.coding_profile_source_type NOT NULL DEFAULT 'PUBLIC_PROFILE',
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_coding_profile_id)
);

CREATE TABLE IF NOT EXISTS public.codechef_profile_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_coding_profile_id uuid NOT NULL REFERENCES public.student_coding_profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  profile_url text,
  current_rating numeric,
  highest_rating numeric,
  stars integer,
  global_rank integer,
  country_rank integer,
  institution_rank integer,
  contest_participation_count integer,
  total_solved integer,
  badge_count integer,
  activity_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_type public.coding_profile_source_type NOT NULL DEFAULT 'PUBLIC_PROFILE',
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_coding_profile_id)
);

CREATE TABLE IF NOT EXISTS public.coding_stats_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_coding_profile_id uuid NOT NULL REFERENCES public.student_coding_profiles(id) ON DELETE CASCADE,
  platform public.coding_platform NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  username text NOT NULL,
  total_solved integer,
  easy_solved integer,
  medium_solved integer,
  hard_solved integer,
  rating numeric,
  highest_rating numeric,
  stars integer,
  global_rank integer,
  country_rank integer,
  contest_count integer,
  badge_count integer,
  source_type public.coding_profile_source_type NOT NULL DEFAULT 'PUBLIC_PROFILE',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_coding_profile_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS public.coding_contest_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_coding_profile_id uuid NOT NULL REFERENCES public.student_coding_profiles(id) ON DELETE CASCADE,
  platform public.coding_platform NOT NULL,
  external_contest_id text,
  contest_name text NOT NULL,
  contest_date date,
  rank integer,
  rating numeric,
  rating_change numeric,
  score numeric,
  division text,
  source public.coding_profile_source_type NOT NULL DEFAULT 'PUBLIC_PROFILE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_coding_profile_id, platform, contest_name, contest_date)
);

CREATE OR REPLACE FUNCTION public.create_or_update_coding_profile(
  p_student_id uuid,
  p_platform public.coding_platform,
  p_username text,
  p_profile_url text,
  p_verified_publicly boolean,
  p_source_type public.coding_profile_source_type
)
RETURNS public.student_coding_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile public.student_coding_profiles;
BEGIN
  INSERT INTO public.student_coding_profiles (
    student_id,
    platform,
    username,
    profile_url,
    sync_status,
    verified_publicly,
    source_type,
    last_sync_started_at,
    last_sync_error,
    updated_at
  )
  VALUES (
    p_student_id,
    p_platform,
    p_username,
    p_profile_url,
    CASE WHEN p_verified_publicly THEN 'VALID' ELSE 'PENDING_SYNC' END,
    p_verified_publicly,
    p_source_type,
    now(),
    NULL,
    now()
  )
  ON CONFLICT (student_id, platform)
  DO UPDATE SET
    username = EXCLUDED.username,
    profile_url = EXCLUDED.profile_url,
    verified_publicly = EXCLUDED.verified_publicly,
    source_type = EXCLUDED.source_type,
    sync_status = CASE WHEN EXCLUDED.verified_publicly THEN 'VALID' ELSE 'PENDING_SYNC' END,
    last_sync_started_at = now(),
    last_sync_error = NULL,
    updated_at = now()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.store_leetcode_stats(
  p_student_coding_profile_id uuid,
  p_username text,
  p_profile_url text,
  p_total_solved integer,
  p_easy_solved integer,
  p_medium_solved integer,
  p_hard_solved integer,
  p_ranking integer,
  p_reputation numeric,
  p_contest_rating numeric,
  p_contest_participation_count integer,
  p_badge_count integer,
  p_activity_summary jsonb,
  p_source_type public.coding_profile_source_type
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.leetcode_profile_stats (
    student_coding_profile_id, username, profile_url, total_solved, easy_solved, medium_solved, hard_solved,
    ranking, reputation, contest_rating, contest_participation_count, badge_count, activity_summary, source_type,
    last_synced_at, updated_at
  )
  VALUES (
    p_student_coding_profile_id, p_username, p_profile_url, p_total_solved, p_easy_solved, p_medium_solved, p_hard_solved,
    p_ranking, p_reputation, p_contest_rating, p_contest_participation_count, p_badge_count, COALESCE(p_activity_summary, '{}'::jsonb),
    p_source_type, now(), now()
  )
  ON CONFLICT (student_coding_profile_id)
  DO UPDATE SET
    username = EXCLUDED.username,
    profile_url = EXCLUDED.profile_url,
    total_solved = EXCLUDED.total_solved,
    easy_solved = EXCLUDED.easy_solved,
    medium_solved = EXCLUDED.medium_solved,
    hard_solved = EXCLUDED.hard_solved,
    ranking = EXCLUDED.ranking,
    reputation = EXCLUDED.reputation,
    contest_rating = EXCLUDED.contest_rating,
    contest_participation_count = EXCLUDED.contest_participation_count,
    badge_count = EXCLUDED.badge_count,
    activity_summary = EXCLUDED.activity_summary,
    source_type = EXCLUDED.source_type,
    last_synced_at = now(),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.store_codechef_stats(
  p_student_coding_profile_id uuid,
  p_username text,
  p_profile_url text,
  p_current_rating numeric,
  p_highest_rating numeric,
  p_stars integer,
  p_global_rank integer,
  p_country_rank integer,
  p_institution_rank integer,
  p_contest_participation_count integer,
  p_total_solved integer,
  p_badge_count integer,
  p_activity_summary jsonb,
  p_source_type public.coding_profile_source_type
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.codechef_profile_stats (
    student_coding_profile_id, username, profile_url, current_rating, highest_rating, stars, global_rank, country_rank, institution_rank,
    contest_participation_count, total_solved, badge_count, activity_summary, source_type, last_synced_at, updated_at
  )
  VALUES (
    p_student_coding_profile_id, p_username, p_profile_url, p_current_rating, p_highest_rating, p_stars, p_global_rank, p_country_rank, p_institution_rank,
    p_contest_participation_count, p_total_solved, p_badge_count, COALESCE(p_activity_summary, '{}'::jsonb), p_source_type, now(), now()
  )
  ON CONFLICT (student_coding_profile_id)
  DO UPDATE SET
    username = EXCLUDED.username,
    profile_url = EXCLUDED.profile_url,
    current_rating = EXCLUDED.current_rating,
    highest_rating = EXCLUDED.highest_rating,
    stars = EXCLUDED.stars,
    global_rank = EXCLUDED.global_rank,
    country_rank = EXCLUDED.country_rank,
    institution_rank = EXCLUDED.institution_rank,
    contest_participation_count = EXCLUDED.contest_participation_count,
    total_solved = EXCLUDED.total_solved,
    badge_count = EXCLUDED.badge_count,
    activity_summary = EXCLUDED.activity_summary,
    source_type = EXCLUDED.source_type,
    last_synced_at = now(),
    updated_at = now();
END;
$$;
