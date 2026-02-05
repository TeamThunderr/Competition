// File Name: od.controller.js
// Purpose: Handle On-Duty (OD) requests for students
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Request OD
const requestOD = async (req, res) => {
    try {
        const {
            competition_id,
            reason,
            from_date,
            to_date,
            is_solo,
            team_name,
            leader_name,
            section,
            team_members,
            proof_urls // Array of strings
        } = req.body;

        const student_id = req.userId;

        // Validation
        if (!competition_id || !reason || !from_date || !to_date) {
            return res.status(400).json({ error: 'Missing required OD fields (Dates, Reason).' });
        }

        // Proof handling: We need a proof URL. 
        // If multiple are sent, take the first one or join them? DB likely stores one string or we need a JSON column.
        // Looking at schema: teams.proof_url is text (likely single URL). od_requests doesn't have proof_url.
        // Strategy: Store MAIN proof in `teams` table (even if it's OD specific, it proves participation).

        const mainProofUrl = (proof_urls && proof_urls.length > 0) ? proof_urls[0] : null;

        if (!mainProofUrl) {
            return res.status(400).json({ error: 'Proof of registration is required.' });
        }

        console.log(`[OD Request] Student: ${student_id}, Comp: ${competition_id}, Solo: ${is_solo}`);


        // 1. Handle Team / Participation Record (Using `teams` table as the container)
        // STRATEGY: Create a "Shadow Team" specifically for this OD Request.
        // Status = 'OD_SUBMITTED'. 
        // This ensures Faculty (who view 'PENDING') do NOT see this.
        // HOD (who view 'PENDING' OD Requests -> linked to this team) WILL see it.

        // Create Shadow Team (Container for Proof)
        // Status = 'OD_SUBMITTED' ensures Faculty (who view 'PENDING') do NOT see this.
        const newTeamName = is_solo ? `OD-Solo-${student_id.substring(0, 4)}-${Date.now()}` : `OD-Team-${team_name}-${Date.now()}`;

        const { data: newTeam, error: teamError } = await supabase
            .from('teams')
            .insert([{
                competition_id: competition_id,
                leader_id: student_id,
                team_name: newTeamName,
                verification_status: 'OD_SUBMITTED', // CRITICAL: Exclude from Faculty View
                proof_url: mainProofUrl,
                members_info: team_members || []
            }])
            .select()
            .single();

        if (teamError) throw teamError;
        team_id = newTeam.id; // Assign the new team ID

        // Verify if user already requested OD (Move check up slightly to fail fast?)
        const { data: existingOD } = await supabase
            .from('od_requests')
            .select('id')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .maybeSingle();

        if (existingOD) {
            return res.status(409).json({ error: 'You have already requested OD for this competition.' });
        }

        // 3. Create OD Request (Directly to HOD)
        const { data: odReq, error: odError } = await supabase
            .from('od_requests')
            .insert([{
                user_id: student_id,
                competition_id: competition_id,
                team_id: team_id,
                reason: reason,
                from_date: from_date,
                to_date: to_date,
                status: 'PENDING'
            }])
            .select()
            .single();

        if (odError) throw odError;

        res.status(201).json({ message: 'OD Request submitted successfully to HOD.', data: odReq });

    } catch (err) {
        console.error('OD Request Error:', err);
        res.status(500).json({ error: 'Internal Server Error: ' + err.message });
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
