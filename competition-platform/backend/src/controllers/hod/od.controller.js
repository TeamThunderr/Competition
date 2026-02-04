// File Name: od.controller.js
// Purpose: Handle OD approvals by HOD
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Get pending OD requests for Department
const getPendingODRequests = async (req, res) => {
    try {
        const hod_dept = req.user.department_id;

        const { data, error } = await supabase
            .from('od_requests')
            .select(`
                *,
                users:users!od_requests_user_id_fkey!inner(full_name, registration_no, department_id, section),
                competitions(title, event_date),
                teams!inner (team_name, proof_url, verification_status)
            `)
            .eq('status', 'PENDING')
            .eq('users.department_id', hod_dept)
            .eq('teams.verification_status', 'VERIFIED'); // Strict: HOD only sees Faculty-verified requests

        if (error) throw error;

        res.status(200).json(data);

    } catch (err) {
        console.error('Get OD Requests Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Approve/Reject OD
const manageODRequest = async (req, res) => {
    try {
        const { request_id, status, timeSlot, duration } = req.body; // 'APPROVED' or 'REJECTED'
        const hod_id = req.userId;

        if (!request_id || !['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Valid Request ID and Status (APPROVED/REJECTED) are required' });
        }

        const { data, error } = await supabase
            .from('od_requests')
            .update({
                status: status,
                approved_by: hod_id,
                approved_at: new Date(),
                time_slot: timeSlot || 'Full Day',
                approved_days: duration ? parseInt(duration) : 1
            })
            .eq('id', request_id)
            .select();

        if (error) throw error;

        res.status(200).json({ message: `OD Request ${status} `, data: data[0] });

    } catch (err) {
        console.error('Manage OD Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getPendingODRequests,
    manageODRequest
};
