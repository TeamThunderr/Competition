// File Name: competition.controller.js (Student)
// Purpose: Handle student competition requests
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const getAllCompetitions = async (req, res) => {
    try {
        const userId = req.userId; // valid thanks to authMiddleware
        console.log("Student Controller - Fetching competitions for user:", userId);

        // Fetch competitions
        const { data: competitions, error: compError } = await supabase
            .from('competitions')
            .select('*')
            .order('registration_deadline', { ascending: true })

        if (compError) {
            console.log("Student Controller - DB Error:", compError);
            throw compError;
        }

        console.log(`Student Controller - Fetched ${competitions.length} competitions`);

        // Fetch user's registrations for these competitions
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('competition_id, source, verified, proof_url')
            .eq('user_id', userId);

        if (regError) throw regError;

        // Fetch user's status (shortlist/winner)
        const { data: statusList, error: statusError } = await supabase
            .from('competition_status')
            .select('competition_id, is_shortlisted, is_winner')
            .eq('user_id', userId);

        if (statusError) throw statusError;

        // Fetch user's OD requests
        const { data: odRequests, error: odError } = await supabase
            .from('od_requests')
            .select('competition_id, status')
            .eq('user_id', userId);

        if (odError) throw odError;

        // Merge data
        const enrichedCompetitions = competitions.map(comp => {
            const reg = registrations.find(r => r.competition_id === comp.id);
            const stat = statusList.find(s => s.competition_id === comp.id);
            const od = odRequests.find(o => o.competition_id === comp.id);

            return {
                ...comp,
                my_registration: reg || null,
                my_status: stat || null,
                my_od: od || null
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

