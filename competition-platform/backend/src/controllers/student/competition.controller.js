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
            .order('registration_deadline', { ascending: true })

        if (compError) {
            console.log("Student Controller - DB Error:", compError);
            throw compError;
        }

        console.log(`Student Controller - Fetched ${competitions.length} competitions`);

        // Fetch user's registrations for these competitions
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('competition_id, source, verified, proof_url, status, gmail_message_id, confidence_score, qualification_verified, shortlist_proof_url, won_status, winning_proof_url, winning_verified, winning_verified_by')
            .eq('user_id', userId);

        if (regError) throw regError;

        // Fetch user's OD requests (Personal OR Team)
        let odRequests = [];
        try {
            // 1. Get teams
            const { data: myTeams } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', userId);

            const teamIds = myTeams?.map(t => t.team_id) || [];

            // 2. Query ODs
            let query = supabase
                .from('od_requests')
                .select('competition_id, status, competitions_info, teams(members_info)') // Added teams(members_info) for letter generation if needed here? Actually fetchODs in history page fetches mostly.
                // But for status card we just need status.
                .order('created_at', { ascending: false });

            if (teamIds.length > 0) {
                const teamListStr = teamIds.join(',');
                query = query.or(`user_id.eq.${userId},team_id.in.(${teamListStr})`);
            } else {
                query = query.eq('user_id', userId);
            }

            const { data, error: odError } = await query;

            if (odError) throw odError;
            odRequests = data || [];
            console.log(`[Competitions] User ${userId} - Teams: ${teamIds.length}, ODs Found: ${odRequests.length}`);
            if (odRequests.length > 0) {
                console.log(`[Competitions] OD IDs: ${odRequests.map(o => o.id).join(', ')}`);
            }
        } catch (err) {
            console.warn("Warning: Could not fetch od_requests", err.message);
            odRequests = [];
        }

        // Merge data
        const enrichedCompetitions = competitions.map(comp => {
            const reg = registrations.find(r => r.competition_id === comp.id);

            // Check if this competition is the main one OR part of combined competitions in ANY OD request
            const od = odRequests.find(o => {
                // Direct match
                if (o.competition_id === comp.id) return true;

                // Check in merged competitions info (JSONB array)
                if (o.competitions_info && Array.isArray(o.competitions_info)) {
                    return o.competitions_info.some(c => c.competition_id === comp.id);
                }

                return false;
            });

            // Derive Shortlist Status from Registration 'status' column (Unified Logic)
            const isShortlisted = (reg?.status === 'Qualified') || (reg?.status === 'SHORTLISTED');
            // Use both legacy 'Winner' status and new 'won_status' column
            const isWinner = (reg?.status === 'Winner') || (reg?.won_status === 'WON');

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
        console.error('Error fetching competitions (FULL):', JSON.stringify(err, null, 2));
        console.error('Error Stack:', err.stack);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
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
