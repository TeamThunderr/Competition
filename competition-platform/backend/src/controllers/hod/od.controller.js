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
                teams (team_name, proof_url, verification_status)
            `)
            .eq('status', 'PENDING')
            .eq('users.department_id', hod_dept);
        // .eq('teams.verification_status', 'VERIFIED'); // Removed: HOD sees all, verification is internal or informational

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

const getODRequestDetail = async (req, res) => {
    console.log(`getODRequestDetail called for ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        const hod_dept = req.user.department_id;

        const { data, error } = await supabase
            .from('od_requests')
            .select(`
                *,
                users:users!od_requests_user_id_fkey!inner(full_name, registration_no, department_id, section),
                competitions(title, event_date),
                teams (team_name, proof_url, verification_status, members_info)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        console.log("Fetched OD Request Data:", JSON.stringify(data, null, 2));

        // Security check: Ensure it belongs to HOD's dept
        if (data.users.department_id !== hod_dept) {
            return res.status(403).json({ error: 'Unauthorized: Student belongs to another department' });
        }

        res.status(200).json(data);

    } catch (err) {
        console.error('Get OD Detail Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getPendingODRequests,
    manageODRequest,
    getODRequestDetail
};
