// File Name: competition.controller.js (Student)
// Purpose: Handle student competition requests
// UPDATED: Removed all references to deprecated 'participation' table

const supabase = require('../../config/supabaseClient');

const getAllCompetitions = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("Student Controller - Fetching competitions for user:", userId);

        // Fetch competitions (only registrations count now - participation table removed)
        const { data: competitions, error: compError } = await supabase
            .from('competitions')
            .select('*, registrations(count)')
            .order('registration_deadline', { ascending: false })

        if (compError) {
            console.log("Student Controller - DB Error:", compError);
            throw compError;
        }

        console.log(`Student Controller - Fetched ${competitions.length} competitions`);

        // Fetch user's registrations for these competitions
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('competition_id, source, verified, proof_url, status, gmail_message_id, confidence_score')
            .eq('user_id', userId);

        if (regError) throw regError;

        // Fetch user's status (shortlist/winner)
        let statusList = [];
        try {
            const { data, error: statusError } = await supabase
                .from('competition_status')
                .select('competition_id, is_shortlisted, is_winner')
                .eq('user_id', userId);

            if (statusError) throw statusError;
            statusList = data;
        } catch (err) {
            console.warn("Warning: Could not fetch competition_status (Table might be missing or empty)", err.message);
            statusList = [];
        }

        // Fetch user's OD requests
        let odRequests = [];
        try {
            const { data, error: odError } = await supabase
                .from('od_requests')
                .select('competition_id, status')
                .eq('user_id', userId);

            if (odError) throw odError;
            odRequests = data || [];
        } catch (err) {
            console.warn("Warning: Could not fetch od_requests", err.message);
            odRequests = [];
        }

        // Merge data
        const enrichedCompetitions = competitions.map(comp => {
            const reg = registrations?.find(r => r.competition_id === comp.id);

            const stat = statusList?.find(s => s.competition_id === comp.id);
            const od = odRequests?.find(o => o.competition_id === comp.id);

            // Derive Shortlist Status from Registration 'status' column (Unified Logic)
            const isShortlisted = (stat?.is_shortlisted) || (reg?.status === 'Qualified') || (reg?.status === 'SHORTLISTED');
            const isWinner = stat?.is_winner || false;

            const derivedStatus = {
                is_shortlisted: isShortlisted,
                is_winner: isWinner
            };

            // Get count from registrations
            const totalCount = comp.registrations && comp.registrations[0] ? comp.registrations[0].count : 0;

            return {
                ...comp,
                my_registration: reg || null,
                my_status: derivedStatus,
                my_od: od || null,
                registrations: [{ count: totalCount }]
            };
        });

        res.status(200).json(enrichedCompetitions);
    } catch (err) {
        console.error('Error fetching competitions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCompetitionDetails = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = { getAllCompetitions, getCompetitionDetails };
