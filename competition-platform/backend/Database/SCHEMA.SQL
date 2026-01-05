CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'HOD', 'ADMIN');

CREATE TYPE status_type AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE registration_source AS ENUM ('AUTO_GMAIL', 'MANUAL_SCREENSHOT');
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT UNIQUE NOT NULL,   -- seeded emails for testing
    full_name TEXT NOT NULL,
    role user_role NOT NULL,

    department_id UUID REFERENCES departments(id),
    section TEXT,

    -- student-only
    registration_no TEXT UNIQUE,
    admission_year INT,
    cgpa NUMERIC(3,2),
    attendance NUMERIC(5,2),

    -- faculty-only
    assigned_sections TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);
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
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,

    source registration_source,
    proof_url TEXT,

    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id), -- FACULTY

    registered_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id, competition_id)
);
CREATE TABLE competition_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,

    is_shortlisted BOOLEAN DEFAULT FALSE,
    is_winner BOOLEAN DEFAULT FALSE,

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id, competition_id)
);
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
ALTER TABLE users ADD COLUMN phone_number TEXT;
UPDATE users 
SET phone_number = '98765' || substring(registration_no from 5) 
WHERE role = 'STUDENT';

-- Department Filter Support
ALTER TABLE competitions ADD COLUMN departments text[] DEFAULT ARRAY['All'];