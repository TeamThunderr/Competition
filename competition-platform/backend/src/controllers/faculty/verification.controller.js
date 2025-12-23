// File Name: verification.controller.js
// Purpose: Handle verification of student registrations by Faculty

const supabase = require('../../config/supabaseClient');

// Get pending verifications (where verified is false AND proof_url is not null)
const getPendingVerifications = async (req, res) => {
    try {
        console.log('[Verification] Fetching ALL pending (Debug Mode)...');

        // 1. Fetch Raw Registrations (No Joins)
        const { data: rawRegs, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('verified', false)
            .not('proof_url', 'is', null);

        if (error) throw error;

        console.log(`[Verification] Found ${rawRegs.length} raw records.`);

        // 2. Manual Enrichment (To bypass join issues)
        if (rawRegs.length > 0) {
            // Fetch Users
            const userIds = [...new Set(rawRegs.map(r => r.user_id))];
            const { data: users } = await supabase.from('users').select('id, full_name, registration_no, section, department_id').in('id', userIds);
            const userMap = {};
            users?.forEach(u => userMap[u.id] = u);

            // Fetch Competitions
            const compIds = [...new Set(rawRegs.map(r => r.competition_id))];
            const { data: comps } = await supabase.from('competitions').select('id, title').in('id', compIds);
            const compMap = {};
            comps?.forEach(c => compMap[c.id] = c);

            // Merge
            const enriched = rawRegs.map(r => ({
                ...r,
                users: userMap[r.user_id] || { full_name: 'Unknown User', registration_no: 'N/A' },
                competitions: compMap[r.competition_id] || { title: 'Unknown Competition' }
            }));

            return res.status(200).json(enriched);
        }

        res.status(200).json([]);

    } catch (err) {
        console.error('Get Pending Verification Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Verify (Approve/Reject)
const verifyRegistration = async (req, res) => {
    try {
        const { registration_id, status } = req.body;
        const faculty_id = req.userId;

        if (!registration_id || !status) {
            return res.status(400).json({ error: 'Registration ID and Status are required' });
        }

        if (status === 'APPROVED') {
            const { data, error } = await supabase
                .from('registrations')
                .update({ verified: true, verified_by: faculty_id })
                .eq('id', registration_id)
                .select();

            if (error) throw error;
            return res.status(200).json({ message: 'Verified', data: data[0] });

        } else if (status === 'REJECTED') {
            const { error } = await supabase
                .from('registrations')
                .delete()
                .eq('id', registration_id);

            if (error) throw error;
            return res.status(200).json({ message: 'Rejected' });
        }
    } catch (err) {
        console.error('Verify Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getPendingVerifications,
    verifyRegistration
};
