// File Name: approval.controller.js
// Purpose: Manage approvals by Faculty and HOD
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Student requests approval
const requestApproval = async (req, res) => {
    try {
        const { competition_id } = req.body;
        const userId = req.userId;

        const { data, error } = await supabase
            .from('approvals')
            .insert([{ user_id: userId, competition_id }])
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
        const { approval_id, status } = req.body; // status: APPROVED or REJECTED

        const { error } = await supabase
            .from('approvals')
            .update({ faculty_status: status })
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
        const { approval_id, status } = req.body;

        const { error } = await supabase
            .from('approvals')
            .update({ hod_status: status })
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
        // We perform a join (conceptually) by filtering users.
        const { data, error } = await supabase
            .from('approvals')
            .select(`
                *,
                users!inner (
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
