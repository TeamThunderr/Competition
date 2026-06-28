// File Name: verification.controller.js
// Purpose: Handle manual verification of student registrations, shortlists, and winnings (Faculty)

const { sendResponse } = require('../../utils/responseHelper');
const supabase = require('../../config/supabaseClient');
const { getMyStudentIds } = require('./faculty.controller');

// 1. Get Pending Verifications
const getPendingVerifications = async (req, res) => {
    try {
        const { assigned_sections, department_id } = req.user;
        const myStudentIds = await getMyStudentIds(req.user.id, department_id, assigned_sections || []);

        if (myStudentIds.length === 0) {
            return sendResponse(res, 200, [], 'No students found');
        }

        const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
                id, registered_at, proof_url, verified, status, source,
                users!registrations_user_id_fkey!inner ( full_name, registration_no, section ),
                competitions!inner ( title )
            `)
            .in('user_id', myStudentIds)
            .eq('verified', false)
            .not('proof_url', 'is', null) // Exclude rejected requests without new proofs
            .order('registered_at', { ascending: false });

        if (error) throw error;

        // Map to frontend expectation
        const mappedRegs = registrations.map(r => ({
            id: r.id,
            competitions: { title: r.competitions.title },
            users: {
                full_name: r.users.full_name,
                registration_no: r.users.registration_no,
                section: r.users.section
            },
            proof_url: r.proof_url,
            status: r.status,
            source: r.source,
            created_at: r.registered_at
        }));

        sendResponse(res, 200, mappedRegs, 'Fetched pending registrations');
    } catch (err) {
        console.error('[VerificationController] Pending Regs Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error: ' + err.message);
    }
};

// 2. Verify (Approve/Reject) Registration
const verifyRegistration = async (req, res) => {
    try {
        const { registration_id, action } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return sendResponse(res, 400, null, 'Invalid action');
        }

        if (action === 'approve') {
            const { error } = await supabase
                .from('registrations')
                .update({ verified: true, status: 'Registered' })
                .eq('id', registration_id);
            if (error) throw error;
        } else {
            // Reject -> Update proof_url to null to allow re-upload
            const { error } = await supabase
                .from('registrations')
                .update({ 
                    verified: false, 
                    proof_url: null,
                    status: 'Rejected'
                })
                .eq('id', registration_id);
            if (error) throw error;
        }

        sendResponse(res, 200, null, `Registration ${action}ed`);
    } catch (err) {
        console.error('[VerificationController] Verify Error:', err);
        sendResponse(res, 500, null, 'Verification failed');
    }
};

// 3. Get Pending Shortlist Verifications
const getPendingShortlistVerifications = async (req, res) => {
    try {
        const { assigned_sections, department_id } = req.user;
        const myStudentIds = await getMyStudentIds(req.user.id, department_id, assigned_sections || []);

        if (myStudentIds.length === 0) {
            return sendResponse(res, 200, [], 'No students found');
        }

        const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
                id, registered_at, shortlist_proof_url, qualification_verified, status,
                users!registrations_user_id_fkey!inner ( full_name, registration_no, section ),
                competitions!inner ( title )
            `)
            .in('user_id', myStudentIds)
            .eq('status', 'Qualified')
            .eq('qualification_verified', false)
            .not('shortlist_proof_url', 'is', null)
            .order('registered_at', { ascending: false });

        if (error) {
            console.error('[VerificationController] Pending Shortlist Query Error:', error);
            throw error;
        }

        const mappedRegs = registrations.map(r => ({
            id: r.id,
            competitions: { title: r.competitions.title },
            users: {
                full_name: r.users.full_name,
                registration_no: r.users.registration_no,
                section: r.users.section
            },
            proof_url: r.shortlist_proof_url, 
            created_at: r.registered_at,
            type: 'SHORTLIST'
        }));

        sendResponse(res, 200, mappedRegs, 'Fetched pending shortlists');
    } catch (err) {
        console.error('[VerificationController] Pending Shortlist Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

// 4. Verify Shortlist
const verifyShortlist = async (req, res) => {
    const { registration_id, action } = req.body;

    try {
        if (action === 'approve') {
            const { error } = await supabase
                .from('registrations')
                .update({ qualification_verified: true })
                .eq('id', registration_id);
            if (error) throw error;
        } else if (action === 'reject') {
            const { error } = await supabase
                .from('registrations')
                .update({ shortlist_proof_url: null, qualification_verified: false })
                .eq('id', registration_id);
            if (error) throw error;
        }

        sendResponse(res, 200, null, `Shortlist ${action}d successfully`);
    } catch (err) {
        console.error('[VerificationController] Verify Shortlist Error:', err);
        sendResponse(res, 500, null, 'Failed to verify');
    }
};

// 5. Get Pending Winning Verifications
const getPendingWinningVerifications = async (req, res) => {
    try {
        const { assigned_sections, department_id } = req.user;
        const myStudentIds = await getMyStudentIds(req.user.id, department_id, assigned_sections || []);

        if (myStudentIds.length === 0) {
            return sendResponse(res, 200, [], 'No students found');
        }

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
            .in('user_id', myStudentIds)
            .eq('won_status', 'WON')
            .eq('winning_verified', false);

        if (error) throw error;

        const responseData = requests.map(req => ({
            id: req.id,
            studentName: req.users.full_name,
            regNo: req.users.registration_no,
            competition: req.competitions.title,
            proofUrl: req.winning_proof_url,
            status: 'Pending',
            submittedAt: new Date(req.registered_at).toLocaleDateString(),
            type: 'WINNING'
        }));

        sendResponse(res, 200, responseData, 'Fetched pending winning verifications');

    } catch (err) {
        console.error('[VerificationController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

// 6. Verify Winning
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
    getPendingShortlistVerifications,
    verifyShortlist,
    getPendingWinningVerifications,
    verifyWinning
};
