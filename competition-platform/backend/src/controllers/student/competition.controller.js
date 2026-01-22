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
            .select('*, registrations(count), participation(count)')
            .order('registration_deadline', { ascending: false })

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

        // Fetch user's participation (Gmail Sync)
        const { data: participation, error: partError } = await supabase
            .from('participation')
            .select('competition_id, status, confidence_score')
            .eq('student_id', userId);

        if (partError) throw partError;

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
            const part = participation.find(p => p.competition_id === comp.id);

            // Prioritize manual registration if available, otherwise check participation
            let myRegistration = null;
            if (reg) {
                myRegistration = reg;
            } else if (part) {
                // Mock a registration object from participation data
                myRegistration = {
                    competition_id: comp.id,
                    source: 'GMAIL',
                    verified: true, // or check part.confidence_score > threshold?
                    proof_url: null,
                    status: part.status
                };
            }

            const stat = statusList.find(s => s.competition_id === comp.id);
            const od = odRequests.find(o => o.competition_id === comp.id);

            // Aggregate counts (Manual + Sync)
            const manualCount = comp.registrations && comp.registrations[0] ? comp.registrations[0].count : 0;
            const autoCount = comp.participation && comp.participation[0] ? comp.participation[0].count : 0;
            const totalCount = manualCount + autoCount;

            return {
                ...comp,
                my_registration: myRegistration || null,
                my_status: stat || null,
                my_od: od || null,
                registrations: [{ count: totalCount }] // Hack: Mocked structure for frontend consistency
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

