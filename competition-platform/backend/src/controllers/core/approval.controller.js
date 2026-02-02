// File Name: approval.controller.js
// Purpose: Manage approvals by Faculty and HOD
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Student requests approval
const requestApproval = async (req, res) => {
    try {
        const { competition_id, reason } = req.body;
        const userId = req.userId;

        const { data, error } = await supabase
            .from('od_requests')
            .insert([{
                user_id: userId,
                competition_id,
                reason: reason || 'No reason provided'
            }])
            .select();

        if (error) return res.status(500).json({ error: error.message });

        res.status(201).json({ message: 'Approval requested', data: data[0] });
    } catch (err) {
        console.error('Error requesting approval:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Faculty updates approval status
const updateFacultyStatus = async (req, res) => {
    try {
        const { approval_id, status, duration } = req.body; // status: APPROVED or REJECTED
        const userId = req.userId;

        const { error } = await supabase
            .from('od_requests')
            .update({
                status: status, // Assuming status matches enum logic (APPROVED/REJECTED/PENDING)
                approved_by: userId,
                approved_at: new Date(),
                approved_days: duration ? parseInt(duration) : 1
            })
            .eq('id', approval_id);

        if (error) return res.status(500).json({ error: error.message });

        res.status(200).json({ message: 'Faculty status updated' });
    } catch (err) {
        console.error('Error updating faculty status:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// HOD updates approval status
const updateHodStatus = async (req, res) => {
    try {
        const { approval_id, status, duration } = req.body;
        const userId = req.userId;

        const { error } = await supabase
            .from('od_requests')
            .update({
                status: status,
                approved_by: userId,
                approved_at: new Date(),
                approved_days: duration ? parseInt(duration) : 1
            })
            .eq('id', approval_id);

        if (error) return res.status(500).json({ error: error.message });

        res.status(200).json({ message: 'HOD status updated' });
    } catch (err) {
        console.error('Error updating HOD status:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get pending approvals for my department (Faculty/HOD)
const getDepartmentApprovals = async (req, res) => {
    try {
        const userId = req.userId;

        // 1. Get my department
        const { data: user } = await supabase
            .from('users')
            .select('department_id')
            .eq('id', userId)
            .single();

        if (!user || !user.department_id) {
            return res.status(400).json({ error: 'User does not belong to a department' });
        }

        // 2. Get approvals for users in this department
        // Using explicit join syntax similar to od.controller.js for safety
        const { data, error } = await supabase
            .from('od_requests')
            .select(`
                *,
                users:users!od_requests_user_id_fkey!inner (
                    full_name,
                    email,
                    department_id
                ),
                competitions (
                    title
                )
            `)
            .eq('users.department_id', user.department_id);

        if (error) return res.status(500).json({ error: error.message });

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching approvals:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    requestApproval,
    updateFacultyStatus,
    updateHodStatus,
    getDepartmentApprovals
};
