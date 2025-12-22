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

        // 1. Verify that student is SHORTLISTED for this competition
        // (Only shortlisted students can request OD)
        const { data: statusCheck, error: statusError } = await supabase
            .from('competition_status')
            .select('is_shortlisted')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        if (statusError || !statusCheck || !statusCheck.is_shortlisted) {
            return res.status(400).json({ error: 'You can only request OD if you are shortlisted.' });
        }

        // 2. Check if already requested
        const { data: existing } = await supabase
            .from('od_requests')
            .select('*')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'OD Request already exists.' });
        }

        // 3. Create Request
        const { data, error } = await supabase
            .from('od_requests')
            .insert([{
                user_id: student_id,
                competition_id: competition_id,
                reason: reason,
                status: 'PENDING'
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

        const { data, error } = await supabase
            .from('od_requests')
            .select(`
                *,
                competitions (title, event_date)
            `)
            .eq('user_id', student_id);

        if (error) throw error;

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
