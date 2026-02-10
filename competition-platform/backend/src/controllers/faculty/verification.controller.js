// File Name: verification.controller.js
// Purpose: Handle manual verification of student registrations (Faculty)
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');
const supabase = require('../../config/supabaseClient');

// 1. Get Pending Verifications (For Faculty Dashboard)
const getPendingVerifications = async (req, res) => {
    try {
        const { assigned_sections, department_id } = req.user;

        // Logic: Fetch registrations that are 'Pending' (verified = false)
        // AND belong to students in my assigned sections/department.

        // We can reuse the "getMyStudentIds" logic if it were shared, 
        // or just join with users table and filter in the query.

        console.log(`[Verification] Fetching pending requests for Dept: ${department_id}`);

        const { data: requests, error } = await supabase
            .from('registrations')
            .select(`
                id,
                registered_at,
                source,
                proof_url,
                verified,
                users!registrations_user_id_fkey!inner (
                    id,
                    full_name,
                    registration_no,
                    section,
                    department_id
                ),
                competitions!inner (
                    id,
                    title
                )
            `)
            .eq('verified', false)
            .eq('source', 'MANUAL_SCREENSHOT') // Only show manual ones for validation (or all?)
            .eq('users.department_id', department_id);
        // Note: assigned_sections filtering is harder via join. 
        // We'll fetch Dept-wide and filter in memory if strict section access is needed.
        // For MVP, Dept access is fine.

        if (error) throw error;

        // Filter by assigned sections (if strictly enforced)
        const allowedSections = assigned_sections
            ? assigned_sections.map(s => s.split('-')[1] || s).map(s => s.trim())
            : [];

        // If assigned_sections is empty/null, maybe allow all (HOD/Admin role reuse) or none?
        // Let's assume Faculty *must* be assigned sections, or they see nothing.
        // Or if they are "Class Advisor", they see their class.

        const filteredRequests = requests.filter(req => {
            if (allowedSections.length === 0) return true; // Fallback: Show all if no assignment logic
            return allowedSections.includes(req.users.section);
        });

        // Map to UI friendly format
        const responseData = filteredRequests.map(req => ({
            id: req.id,
            studentName: req.users.full_name,
            regNo: req.users.registration_no,
            section: req.users.section,
            competition: req.competitions.title,
            proofUrl: req.proof_url,
            status: 'Pending',
            registered_at: req.registered_at // Return raw timestamp for frontend formatting
        }));

        sendResponse(res, 200, responseData, 'Fetched pending verifications');

    } catch (err) {
        console.error('[VerificationController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

// 2. Verify (Approve/Reject) Registration
const verifyRegistration = async (req, res) => {
    try {
        const { registration_id, action } = req.body; // action: 'approve' | 'reject'
        const faculty_id = req.user.id;

        if (!registration_id || !action) {
            return sendResponse(res, 400, null, 'Registration ID and Action are required');
        }

        if (action === 'approve') {
            const { data, error } = await supabase
                .from('registrations')
                .update({
                    verified: true,
                    verified_by: faculty_id
                })
                .eq('id', registration_id)
                .select();

            if (error) throw error;
            sendResponse(res, 200, data, 'Registration Verified Successfully');

        } else if (action === 'reject') {
            // Option A: Delete the record
            // Option B: Set status='REJECTED' (if we had a status column. We have 'verified' bool only).
            // Schema check: registrations table has 'verified' (bool). 
            // detected_hackathons has 'status'.
            // registrations also has 'status'?? Let's check schema/previous implementation.
            // The user schema typically had 'verified' boolean. 
            // If we assume 'reject' means invalid proof -> Delete request so they can upload again?

            const { error } = await supabase
                .from('registrations')
                .delete()
                .eq('id', registration_id);

            if (error) throw error;
            sendResponse(res, 200, null, 'Registration Request Rejected (Deleted)');
        } else {
            return sendResponse(res, 400, null, 'Invalid Action');
        }

    } catch (err) {
        console.error('[VerificationController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const getPendingWinningVerifications = async (req, res) => {
    try {
        const { department_id } = req.user;

        const { data: requests, error } = await supabase
            .from('registrations')
            .select(`
                id,
                registered_at,
                source,
                winning_proof_url,
                won_status,
                winning_verified,
                users!registrations_user_id_fkey!inner (
                    id,
                    full_name,
                    registration_no,
                    section,
                    department_id
                ),
                competitions!inner (
                    id,
                    title
                )
            `)
            .eq('won_status', 'WON')
            .eq('winning_verified', false)
            .eq('users.department_id', department_id);

        if (error) throw error;

        const responseData = requests.map(req => ({
            id: req.id,
            studentName: req.users.full_name,
            regNo: req.users.registration_no,
            section: req.users.section,
            competition: req.competitions.title,
            proofUrl: req.winning_proof_url,
            status: 'Pending',
            registered_at: req.registered_at, // Return raw timestamp for frontend formatting
            type: 'WINNING'
        }));

        sendResponse(res, 200, responseData, 'Fetched pending winning verifications');

    } catch (err) {
        console.error('[VerificationController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const verifyWinning = async (req, res) => {
    try {
        const { registration_id, action } = req.body;
        const faculty_id = req.user.id;

        if (!registration_id || !action) {
            return sendResponse(res, 400, null, 'Registration ID and Action are required');
        }

        if (action === 'approve') {
            const { data, error } = await supabase
                .from('registrations')
                .update({
                    winning_verified: true,
                    winning_verified_by: faculty_id,
                    status: 'Winner'
                })
                .eq('id', registration_id)
                .select();

            if (error) throw error;
            sendResponse(res, 200, data, 'Winning Status Verified Successfully');

        } else if (action === 'reject') {
            const { error } = await supabase
                .from('registrations')
                .update({
                    won_status: 'PENDING',
                    winning_proof_url: null,
                    winning_verified: false,
                    status: 'Qualified'
                })
                .eq('id', registration_id);

            if (error) throw error;
            sendResponse(res, 200, null, 'Winning Proof Rejected');
        } else {
            return sendResponse(res, 400, null, 'Invalid Action');
        }

    } catch (err) {
        console.error('[VerificationController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

module.exports = {
    getPendingVerifications,
    verifyRegistration,
    getPendingWinningVerifications,
    verifyWinning
};
