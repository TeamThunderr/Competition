// File Name: competition.controller.js (Student)
// Purpose: Handle student competition requests
// UPDATED: Removed all references to deprecated 'participation' table
// UPDATED: Added pagination support on getAllCompetitions

const supabase = require('../../config/supabaseClient');
const { applyPagination, paginatedResponse } = require('../../utils/paginate.util');

const getAllCompetitions = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("Student Controller - Fetching all competitions for user:", userId);

        // Build competitions query with exact count
        const { data: competitions, error: compError, count } = await supabase
            .from('competitions')
            .select('*, registrations(count)', { count: 'exact' })
            .order('registration_deadline', { ascending: true });

        if (compError) {
            console.log("Student Controller - DB Error:", compError);
            throw compError;
        }

        console.log(`Student Controller - Fetched ${competitions.length} competitions (total: ${count})`);

        // Fetch user's registrations for these competitions
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('competition_id, source, verified, proof_url, status, gmail_message_id, confidence_score, qualification_verified, shortlist_proof_url, won_status, winning_proof_url, winning_verified, winning_verified_by')
            .eq('user_id', userId);

        if (regError) throw regError;

        // Fetch user's OD requests
        let odRequests = [];
        try {
            const { data, error: odError } = await supabase
                .from('od_requests')
                .select('competition_id, status, competitions_info')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (odError) throw odError;
            odRequests = data || [];
        } catch (err) {
            console.warn("Warning: Could not fetch od_requests", err.message);
            odRequests = [];
        }

        // Fetch user's temp registrations
        let tempRegistrations = [];
        try {
            const { data, error: tempError } = await supabase
                .from('student_competition_temp_status')
                .select('competition_id, is_temp_registered, temp_registered_at')
                .eq('student_id', userId)
                .eq('is_temp_registered', true);

            if (tempError) throw tempError;
            tempRegistrations = data || [];
        } catch (err) {
            console.warn("Warning: Could not fetch student_competition_temp_status", err.message);
            tempRegistrations = [];
        }

        // Merge data
        const enrichedCompetitions = competitions.map(comp => {
            const reg = registrations.find(r => r.competition_id === comp.id);
            const tempReg = tempRegistrations.find(t => t.competition_id === comp.id);

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
                is_temp_registered: !!tempReg,
                temp_registered_at: tempReg ? tempReg.temp_registered_at : null,
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

const toggleTempRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const { competition_id, is_temp_registered } = req.body;

        if (!competition_id) {
            return res.status(400).json({ error: 'competition_id is required' });
        }

        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('student_competition_temp_status')
            .upsert({
                student_id: userId,
                competition_id: competition_id,
                is_temp_registered: Boolean(is_temp_registered),
                temp_registered_at: Boolean(is_temp_registered) ? now : null
            }, { onConflict: 'student_id,competition_id' })
            .select()
            .single();

        if (error) {
            console.error("Error toggling temp registration:", error);
            throw error;
        }

        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('Error in toggleTempRegistration:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

module.exports = { getAllCompetitions, getCompetitionDetails, toggleTempRegistration };
