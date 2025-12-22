// File Name: verification.controller.js
// Purpose: Handle verification of student registrations by Faculty
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Get pending verifications (where verified is false AND proof_url is not null)
const getPendingVerifications = async (req, res) => {
    try {
        const faculty_id = req.userId;
        const faculty_dept = req.user.department_id;

        // In a real app, we might filter by the faculty's assigned sections.
        // For simplicity, we'll show all pending registrations for their department.

        // Use a join to filter by users in the same department
        const { data, error } = await supabase
            .from('registrations')
            .select(`
                *,
                users!inner(full_name, registration_no, department_id, section),
                competitions(title)
            `)
            .eq('verified', false)
            .not('proof_url', 'is', null) // Only show ones with proof
            .eq('users.department_id', faculty_dept);

        if (error) throw error;

        res.status(200).json(data);

    } catch (err) {
        console.error('Get Pending Verification Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Verify (Approve/Reject)
const verifyRegistration = async (req, res) => {
    try {
        const { registration_id, status } = req.body; // status: 'APPROVED' or 'REJECTED'
        const faculty_id = req.userId;

        if (!registration_id || !status) {
            return res.status(400).json({ error: 'Registration ID and Status are required' });
        }

        if (status === 'APPROVED') {
            const { data, error } = await supabase
                .from('registrations')
                .update({
                    verified: true,
                    verified_by: faculty_id
                })
                .eq('id', registration_id)
                .select();

            if (error) throw error;
            return res.status(200).json({ message: 'Registration Verified Successfully', data: data[0] });

        } else if (status === 'REJECTED') {
            // If rejected, we might delete the registration entry so they can try again, 
            // OR keep it restricted. Let's delete it to allow re-upload.
            const { error } = await supabase
                .from('registrations')
                .delete()
                .eq('id', registration_id);

            if (error) throw error;
            return res.status(200).json({ message: 'Registration Rejected and Removed.' });
        } else {
            return res.status(400).json({ error: 'Invalid Status' });
        }

    } catch (err) {
        console.error('Verify Registration Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getPendingVerifications,
    verifyRegistration
};
