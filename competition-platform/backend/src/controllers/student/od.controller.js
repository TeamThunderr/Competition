// File Name: od.controller.js
// Purpose: Handle On-Duty (OD) requests for students
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Request OD
const requestOD = async (req, res) => {
    try {
        const { competition_id, reason } = req.body;
        const student_id = req.userId;

        if (!competition_id || !reason) {
            return res.status(400).json({ error: 'Competition ID and Reason are required' });
        }

        // 1. Check if Shortlisted OR Team Verified
        // (We allow OD if either Shortlisted via System OR Team Verified via Faculty)

        const { data: statusCheck } = await supabase
            .from('competition_status')
            .select('is_shortlisted')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        let isShortlisted = statusCheck?.is_shortlisted;

        // 2. Check Team Verification Status
        // Find team membership for this competition
        const { data: teamData } = await supabase
            .from('team_members')
            .select(`
                team_id,
                teams!inner ( verification_status, id )
            `)
            .eq('user_id', student_id)
            .eq('teams.competition_id', competition_id)
            .single();

        let team_id = null;
        let isTeamVerified = false;

        if (teamData && teamData.teams) {
            team_id = teamData.team_id;
            isTeamVerified = teamData.teams.verification_status === 'VERIFIED';

            // If in a team, and NOT verified, BLOCK IT (even if shortlisted? Maybe safe to block).
            if (!isTeamVerified) {
                return res.status(400).json({ error: 'Your Team Leader must upload proof and get Faculty Verification before you can request OD.' });
            }
        }

        // Final Eligibility Check
        if (!isShortlisted && !isTeamVerified) {
            return res.status(400).json({ error: 'You can only request OD if you are Shortlisted or your Team is Verified.' });
        }

        // (Team check moved up)

        // 3. Check if already requested
        const { data: existing } = await supabase
            .from('od_requests')
            .select('*')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'OD Request already exists.' });
        }

        // 4. Create Request
        const { data, error } = await supabase
            .from('od_requests')
            .insert([{
                user_id: student_id,
                competition_id: competition_id,
                reason: reason,
                status: 'PENDING',
                team_id: team_id
            }])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'OD Request submitted to HOD.', data: data[0] });

    } catch (err) {
        console.error('OD Request Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get my OD requests
const getMyODRequests = async (req, res) => {
    try {
        const student_id = req.userId;
        console.log(`[OD] Fetching requests for student: ${student_id}`);

        const { data, error } = await supabase
            .from('od_requests')
            .select(`
                *,
                competitions (title, event_date),
                teams (team_name, members_info)
            `)
            .eq('user_id', student_id);

        if (error) {
            console.error('[OD] Fetch Error:', error);
            throw error;
        }

        console.log(`[OD] Found ${data ? data.length : 0} requests.`);
        res.status(200).json(data);

    } catch (err) {
        console.error('Get OD Requests Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    requestOD,
    getMyODRequests
};
