CREATE TABLE detected_hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    hackathon_name TEXT,
    platform TEXT, -- Devfolio, Unstop, etc.
    status TEXT, -- REGISTERED, QUALIFIED, REJECTED, ACTION_REQUIRED
    
    source TEXT DEFAULT 'GMAIL',
    email_date TIMESTAMPTZ,
    confidence_score INT,
    
    snippet TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
