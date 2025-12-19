-- File: backend/database/schema.sql
-- Description: Database schema for College Competition Management Platform
-- Purpose: Create tables and security policies (RLS) for Supabase

-- 1. ENUMS
-- unique roles for the platform
CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'HOD', 'ADMIN');

-- status for approvals/invites
CREATE TYPE status_type AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACCEPTED');

-- 2. TABLES

-- Departments Table
-- Stores the list of college departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table
-- Extends the default Supabase auth.users table
-- We link 'id' to auth.users.id to ensure security
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'STUDENT',
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitions Table
-- details about events/competitions
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    platform TEXT, -- e.g., Unstop, HackerRank
    team_allowed BOOLEAN DEFAULT FALSE,
    min_team_size INT DEFAULT 1,
    max_team_size INT DEFAULT 1,
    created_by UUID REFERENCES users(id), -- Admin who created it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams Table
-- groups of students for a competition
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    leader_id UUID REFERENCES users(id),
    team_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members Table
-- mapping users to teams
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invite_status status_type DEFAULT 'PENDING', -- PENDING (invite sent), ACCEPTED (joined)
    PRIMARY KEY (team_id, user_id)
);

-- Approvals Table
-- tracks faculty/HOD verification for participation
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    faculty_status status_type DEFAULT 'PENDING',
    hod_status status_type DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS)
-- This restricts direct database access from the frontend
-- Note: Our Backend Service Role (Node.js) bypasses these checks!

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Policies for Users
-- Users can see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policies for Departments
-- Everyone can view departments
CREATE POLICY "Public view departments" ON departments
    FOR SELECT USING (true);

-- Policies for Competitions
-- Everyone can view competitions
CREATE POLICY "Public view competitions" ON competitions
    FOR SELECT USING (true);
-- Only Admins can insert/update (This logic usually enforced via Backend, but good for RLS too if using JWT)

-- Policies for Teams
-- Admins and Leaders can see/edit teams
-- Students can view teams they are part of
CREATE POLICY "View own team" ON teams
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = id) OR
        auth.uid() = leader_id
    );

-- Policies for Approvals
-- Students can see their own approvals
CREATE POLICY "View own approvals" ON approvals
    FOR SELECT USING (auth.uid() = user_id);

-- 4. TRIGGERS (Optional but helpful)
-- Automatically update user role if needed or handle cleanup
