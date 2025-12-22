-- =========================================
-- College Competition Intelligence Platform
-- FINAL DATABASE SCHEMA (v1)
-- =========================================

-- =====================
-- 1. ENUMS
-- =====================

CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'HOD', 'ADMIN');

CREATE TYPE status_type AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE registration_source AS ENUM (
    'AUTO_GMAIL',
    'MANUAL_SCREENSHOT'
);

-- =====================
-- 2. DEPARTMENTS
-- =====================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 3. USERS (MASTER TABLE)
-- =====================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- common
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,

    -- academic (students + faculty + hod)
    department_id UUID REFERENCES departments(id),
    section TEXT,

    -- student-only
    registration_no TEXT UNIQUE,
    year INT,
    cgpa NUMERIC(3,2),
    attendance NUMERIC(5,2),

    -- faculty-only
    assigned_sections TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 4. COMPETITIONS (ADMIN UPLOADS)
-- =====================

CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    description TEXT,
    organizer TEXT,
    platform TEXT,
    external_link TEXT,

    registration_deadline DATE,
    event_date DATE,
    mode TEXT, -- Online / Offline / Hybrid

    team_allowed BOOLEAN DEFAULT FALSE,
    min_team_size INT DEFAULT 1,
    max_team_size INT DEFAULT 1,

    created_by UUID REFERENCES users(id), -- ADMIN
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 5. REGISTRATIONS (TRACKING ONLY)
-- =====================
-- NOTE: Students DO NOT register inside platform.
-- This table tracks detected / verified registrations.

CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,

    source registration_source,
    proof_url TEXT, -- screenshot if manual

    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id), -- FACULTY

    registered_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id, competition_id)
);

-- =====================
-- 6. SHORTLIST / RESULT STATUS
-- =====================

CREATE TABLE competition_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,

    is_shortlisted BOOLEAN DEFAULT FALSE,
    is_winner BOOLEAN DEFAULT FALSE,

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id, competition_id)
);

-- =====================
-- 7. OD REQUESTS (FINAL APPROVAL BY HOD)
-- =====================

CREATE TABLE od_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,

    reason TEXT,
    status status_type DEFAULT 'PENDING',

    approved_by UUID REFERENCES users(id), -- HOD
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id, competition_id)
);

-- =====================
-- 8. TEAM SUPPORT (OPTIONAL, FUTURE-READY)
-- =====================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    leader_id UUID REFERENCES users(id),
    team_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (competition_id, leader_id)
);

CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- =====================
-- 9. ROW LEVEL SECURITY
-- =====================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE od_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- =====================
-- 10. BASIC RLS POLICIES
-- =====================

-- Users: view own profile
CREATE POLICY "users_view_own"
ON users FOR SELECT
USING (auth.uid() = id);

-- Departments: public read
CREATE POLICY "departments_read"
ON departments FOR SELECT
USING (true);

-- Competitions: public read
CREATE POLICY "competitions_read"
ON competitions FOR SELECT
USING (true);

-- Registrations: students see own
CREATE POLICY "registrations_view_own"
ON registrations FOR SELECT
USING (auth.uid() = user_id);

-- OD requests: students see own
CREATE POLICY "od_view_own"
ON od_requests FOR SELECT
USING (auth.uid() = user_id);
