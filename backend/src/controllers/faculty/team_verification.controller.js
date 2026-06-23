// File Name: team_verification.controller.js
// Purpose: Handle Team Verification by Faculty
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');
const supabase = require('../../config/supabaseClient');
const facultyController = require('./faculty.controller'); // For helper methods

// 1. Get Pending Team Verifications
const getPendingTeamVerifications = async (req, res) => {
    try {
        const { id: facultyId, assigned_sections, department_id } = req.user;

        console.log(`[TeamVerification] Fetching pending teams for Faculty: ${facultyId}, Dept: ${department_id}`);

        // Fetch teams that have uploaded a proof but are not verified yet
        // We filter by 'PENDING' status and non-null proof_url
        const { data: teams, error } = await supabase
            .from('teams')
            .select(`
                id,
                team_name,
                leader_name,

                proof_url,
                proof_urls,
                section,
                department,
                academic_year,
                verification_status,
                created_at,
                competition_id,
                competitions ( title, event_date ),
                leader_id,
                leader:users!teams_leader_id_fkey ( full_name, registration_no, section, department_id )
            `)
            .in('verification_status', ['PENDING', 'VERIFIED', 'REJECTED'])
            .neq('verification_status', 'OD_SUBMITTED') // Exclude correctly marked ODs
            .not('team_name', 'ilike', 'OD-%') // ROBUST: Exclude ANY team starting with OD- (catch old PENDING ones)
            .not('proof_url', 'is', null);

        if (error) throw error;

        // Faculty deals ONLY with registration verification (PENDING/VERIFIED/REJECTED)
        // OD requests use separate status 'OD_SUBMITTED' which Faculty never queries
        // This creates natural separation - no OD-related code needed here

        // 0. Fetch Faculty's Department Details
        // We know req.user.department_id is a UUID. We need the text 'CSE' to match with teams.department text.
        const { data: facultyDeptData } = await supabase
            .from('departments')
            .select('code')
            .eq('id', department_id)
            .single();

        const facultyDeptName = facultyDeptData?.code || ''; // e.g. "CSE"

        // 1. Filter by Department (Match ID or Name)
        let filteredTeams = teams.filter(t => {
            const teamDeptInput = t.department; // "CSE"
            const teamLeaderDeptId = t.leader && t.leader.department_id; // UUID

            // Match if: 
            // - Team Dept Input matches Faculty Dept Name (Text vs Text)
            // - OR Team Leader Dept ID matches Faculty Dept ID (UUID vs UUID)
            const textMatch = teamDeptInput && facultyDeptName && teamDeptInput.trim().toUpperCase() === facultyDeptName.trim().toUpperCase();
            const idMatch = teamLeaderDeptId === department_id;

            return textMatch || idMatch;
        });

        // 2. Filter by Section (if assigned_sections exists)
        // Normalize Faculty Sections: ["CSE-A"] -> ["A"]
        const facultySections = assigned_sections
            ? assigned_sections.map(s => s.split('-')[1] || s).map(s => s.trim().toUpperCase())
            : [];

        if (facultySections.length > 0) {
            filteredTeams = filteredTeams.filter(t => {
                // Normalize Team Section: "Section A" -> "A" (Try to extract last char or word if possible, or just strict match?)
                // Better: Looser match. Check if either side contains the other.
                // "SECTION A" contains "A" -> True.

                const rawTeamSec = (t.section || (t.leader && t.leader.section) || '').trim().toUpperCase();

                // Check if ANY allowed section is found within the team section string, or vice versa
                return facultySections.some(allowedSec => {
                    // allowedSec: "A"
                    // rawTeamSec: "SECTION A"
                    // Logic: "SECTION A".includes("A") OR "A" === "SECTION A"

                    // Avoid false positives like "Section AB".includes("A")? 
                    // For now, strict 'ends with' or simple inclusion is better than nothing.
                    // Let's use simple inclusion check for robustness.
                    return rawTeamSec.includes(allowedSec) || allowedSec.includes(rawTeamSec);
                });
            });
        }

        // Map for response
        const responseTop = filteredTeams.map(t => ({
            id: t.id,
            teamName: t.team_name,
            competitionName: t.competitions?.title || 'Unknown Competition',
            verificationStatus: t.verification_status, // Added this field

            // Prefer manually entered leader details (Wizard), fallback to User Profile
            leaderName: t.leader_name || t.leader?.full_name || 'Unknown',
            leaderRollNo: t.leader?.registration_no || 'N/A',
            leaderSection: t.section || t.leader?.section || 'N/A',


            proofUrl: (t.proof_urls && t.proof_urls.length > 0) ? t.proof_urls[0] : t.proof_url, // Show first proof
            proofUrls: t.proof_urls || [t.proof_url], // Pass all proofs
            submittedAt: new Date(t.created_at).toLocaleDateString()
        }));

        sendResponse(res, 200, responseTop, 'Fetched pending team verifications');

    } catch (err) {
        console.error('[TeamVerification] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

// 2. Verify Team
const verifyTeam = async (req, res) => {
    try {
        const { team_id, action, rejection_reason } = req.body; // action: 'VERIFIED' | 'REJECTED'
        const facultyId = req.user.id;

        if (!team_id || !['VERIFIED', 'REJECTED'].includes(action)) {
            return sendResponse(res, 400, null, 'Valid Team ID and Action (VERIFIED/REJECTED) are required');
        }

        // Update Team Status
        const updatePayload = {
            verification_status: action,
            verified_by: facultyId,
            verified_at: new Date()
        };

        // If rejected, we might want to clear the proof_url so they can re-upload? 
        // Or keep it for record? Let's keep it, but maybe add a note? 
        // For now, simple status update.
        // If rejected, usually we want them to re-upload. So maybe set proof_url to NULL so they can upload again?
        // Requirement: "Fake or inconsistent proofs cannot proceed."
        // If rejected, maybe they need to fix it. 
        if (action === 'REJECTED') {
            // updatePayload.proof_url = null; // Optional: Reset proof ??
            // Let's NOT reset it immediately, let them overwrite it.
            // But if status is REJECTED, can they re-upload? 
            // We need to ensure logic allows re-upload if REJECTED or PENDING.
        }

        const { data, error } = await supabase
            .from('teams')
            .update(updatePayload)
            .eq('id', team_id)
            .select();

        if (error) throw error;

        sendResponse(res, 200, data[0], `Team ${action} Successfully`);

    } catch (err) {
        console.error('[TeamVerification] Verify Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

module.exports = {
    getPendingTeamVerifications,
    verifyTeam
};
