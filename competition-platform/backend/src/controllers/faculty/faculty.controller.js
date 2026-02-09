// Faculty Controller - Verified Consolidated Version
// Integrates Gmail Sync V2 logic, improved Dashboard Stats, and robust Student Filtering
// Supersedes facultyV2.controller.js

const { sendResponse } = require('../../utils/responseHelper');
const supabase = require('../../config/supabaseClient');
const statsService = require('../../services/admin/stats.service');
const { performBatchSync } = require('./participation.controller');

// ------------------------------------------------------------------
// 1. Student & Registration Lists (Legacy/Stable Logic)
// ------------------------------------------------------------------

const getMyStudents = async (req, res) => {
    try {
        const { assigned_sections } = req.user;
        const myDeptId = req.user.department_id;

        if (!assigned_sections || assigned_sections.length === 0) {
            return sendResponse(res, 200, [], 'No sections assigned');
        }

        // Fetch all students (Pagination handled)
        let allStudents = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error: pageError } = await supabase
                .from('users')
                .select(`
                    id, full_name, registration_no, section, email, role,
                    departments!inner ( name )
                `)
                .eq('role', 'STUDENT')
                .eq('department_id', myDeptId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (pageError) throw pageError;

            if (pageData.length > 0) {
                allStudents = [...allStudents, ...pageData];
                page++;
                if (pageData.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        // Case-Insensitive Filtering
        const allowedSections = assigned_sections.map(s => {
            const parts = s.split('-');
            const sec = parts.length > 1 ? parts[1] : s;
            return sec.trim().toUpperCase();
        }).filter(s => s !== '');

        const filteredStudents = allStudents.filter(student => {
            const studentSec = (student.section || '').trim().toUpperCase();
            return allowedSections.includes(studentSec);
        });

        sendResponse(res, 200, filteredStudents, 'Fetched student list');
    } catch (err) {
        console.error('[FacultyController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const getRecentRegistrations = async (req, res) => {
    try {
        const { assigned_sections, department_id } = req.user;
        const myStudentIds = await getMyStudentIds(req.user.id, department_id, assigned_sections || []);

        if (myStudentIds.length === 0) {
            return sendResponse(res, 200, [], 'No students found');
        }

        // Fetch recent registrations with details
        const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
                id, registered_at, verified,
                users!registrations_user_id_fkey!inner ( full_name, registration_no ),
                competitions!inner ( title, registration_deadline )
            `)
            .in('user_id', myStudentIds)
            .order('registered_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const mappedRegs = registrations.map(r => ({
            id: r.id,
            studentName: r.users.full_name,
            regNo: r.users.registration_no,
            competition: r.competitions.title,
            deadline: r.competitions.registration_deadline,
            status: r.verified ? 'Verified' : 'Pending',
            registeredAt: r.registered_at
        }));

        sendResponse(res, 200, mappedRegs, 'Fetched recent registrations');

    } catch (err) {
        console.error('[FacultyController] Error fetching registrations:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const getStats = async (req, res) => {
    // Refactored to return stats ONLY for assigned sections
    try {
        const { assigned_sections, department_id } = req.user;

        // 1. Fetch all students in the department (to get section info)
        let allStudents = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error } = await supabase
                .from('users')
                .select('id, section')
                .eq('role', 'STUDENT')
                .eq('department_id', department_id)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;

            if (pageData.length > 0) {
                allStudents = [...allStudents, ...pageData];
                page++;
                if (pageData.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        // 2. Filter by assigned sections
        const allowedSections = (assigned_sections || []).map(s => {
            const parts = s.split('-');
            const sec = parts.length > 1 ? parts[1] : s;
            return sec.trim().toUpperCase();
        }).filter(s => s !== '');

        const myStudents = allStudents.filter(student => {
            const studentSec = (student.section || '').trim().toUpperCase();
            return allowedSections.includes(studentSec);
        });

        const myStudentIds = myStudents.map(s => s.id);

        // Fetch Department Name (for display consistency)
        let deptName = 'My Department';
        try {
            const { data: deptData } = await supabase.from('departments').select('name').eq('id', department_id).single();
            if (deptData) deptName = deptData.name;
        } catch (ignored) { }


        if (myStudentIds.length === 0) {
            return sendResponse(res, 200, {
                department_id,
                department_name: deptName,
                total_students: 0,
                unique_participants: 0,
                total_registrations: 0,
                verified_registrations: 0,
                unique_winners: {},
                unique_shortlisted: {},
                sections: [],
                winners: 0,
                shortlisted: 0,
                participation_rate: 0,
                success_rate: 0
            }, 'Fetched faculty stats');
        }

        // 3. Stats Aggregation
        // Section Breakdown
        const sectionCounts = {};
        myStudents.forEach(s => {
            const sec = s.section || 'N/A';
            if (!sectionCounts[sec]) sectionCounts[sec] = 0;
            sectionCounts[sec]++;
        });

        const sectionsArray = Object.keys(sectionCounts).map(sec => ({
            name: sec,
            count: sectionCounts[sec]
        })).sort((a, b) => a.name.localeCompare(b.name));

        // 4. Registrations
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('user_id, verified')
            .in('user_id', myStudentIds);

        if (regError) throw regError;

        const uniqueParticipants = new Set(registrations.map(r => r.user_id));
        const totalRegistrations = registrations.length;
        const verifiedRegistrations = registrations.filter(r => r.verified).length;

        // 5. Winners/Shortlisted
        const { data: statuses, error: statusError } = await supabase
            .from('competition_status')
            .select('user_id, is_winner, is_shortlisted')
            .in('user_id', myStudentIds);

        if (statusError) throw statusError;

        const winnersSet = new Set();
        const shortlistedSet = new Set();

        statuses.forEach(s => {
            if (s.is_winner) winnersSet.add(s.user_id);
            if (s.is_shortlisted || s.is_winner) shortlistedSet.add(s.user_id);
        });

        // 6. Rates
        const totalStudents = myStudents.length;
        const participationRate = totalStudents > 0 ? ((uniqueParticipants.size / totalStudents) * 100).toFixed(1) : 0;
        const successRate = uniqueParticipants.size > 0 ? ((winnersSet.size / uniqueParticipants.size) * 100).toFixed(1) : 0;


        const stats = {
            department_id,
            department_name: deptName,
            total_students: totalStudents,
            unique_participants: uniqueParticipants.size,
            total_registrations: totalRegistrations,
            verified_registrations: verifiedRegistrations,
            unique_winners: {}, // Legacy structure compatibility
            unique_shortlisted: {}, // Legacy structure compatibility
            sections: sectionsArray,
            winners: winnersSet.size,
            shortlisted: shortlistedSet.size,
            participation_rate: parseFloat(participationRate),
            success_rate: parseFloat(successRate)
        };

        sendResponse(res, 200, stats, 'Fetched faculty stats');

    } catch (err) {
        console.error('[FacultyController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

// ------------------------------------------------------------------
// 2. Dashboard Stats (V2 Logic)
// ------------------------------------------------------------------

const getDashboardStats = async (req, res) => {
    try {
        const { assigned_sections, department_id, id } = req.user;

        // Get faculty's students (Robust Filtering)
        const myStudentIds = await getMyStudentIds(id, department_id, assigned_sections || []);

        if (myStudentIds.length === 0) {
            return sendResponse(res, 200, {
                total_students: 0,
                comp_registered: 0,
                comp_qualified: 0,
                comp_won: 0, // Added field
                od_requests: 0,
                section_label: assigned_sections?.[0] || 'N/A',
                batch_label: 'N/A'
            }, 'No students found');
        }

        // V2 COUNTS - Single Source of Truth

        // 1. Registered Count: COUNT(DISTINCT user_id) from registrations
        let participationCount = 0;
        let regData = []; // SCOPE FIX: Declare here
        try {
            console.log('[Faculty] Fetching registration stats from REGISTRATIONS...');
            const { data, error: regError } = await supabase
                .from('registrations')
                .select('user_id, competition_id') // Fetch competition_id for debugging
                .in('user_id', myStudentIds);

            if (regError) throw regError;
            regData = data; // Assign to outer variable

            // Calculate Count Distinct User ID (Reverted based on user feedback)
            const uniqueStudents = new Set(regData?.map(r => r.user_id)).size;
            participationCount = uniqueStudents;
            console.log(`[Faculty] Participation Count (Unique): ${participationCount}`);

        } catch (err) {
            console.error('[Faculty] Registration stats FAILED:', err.message);
        }

        // 2. Qualified Count: is_shortlisted = true
        const { count: qualifiedCount, error: qualError } = await supabase
            .from('competition_status')
            .select('*', { count: 'exact', head: true })
            .in('user_id', myStudentIds)
            .eq('is_shortlisted', true);

        if (qualError) throw qualError;



        // 5. Calculate batch label
        let batchLabel = 'N/A';
        if (myStudentIds.length > 0) {
            const { data: sampleStudent } = await supabase
                .from('users')
                .select('registration_no')
                .eq('id', myStudentIds[0])
                .single();

            if (sampleStudent?.registration_no) {
                batchLabel = calculateBatchLabel(sampleStudent.registration_no);
            }
        }

        const stats = {
            total_students: myStudentIds.length,
            comp_registered: participationCount || 0,
            comp_qualified: qualifiedCount || 0,
            od_requests: 0, // Explicitly zeroed out as Faculty has no OD role
            section_label: assigned_sections?.join(', ') || 'N/A',
            batch_label: batchLabel,
            registered_details: regData // Debug info
        };

        console.log('[Faculty] Dashboard Stats:', stats);
        sendResponse(res, 200, stats, 'Fetched dashboard stats');

    } catch (error) {
        console.error('[Faculty] Stats error:', error);
        sendResponse(res, 500, null, 'Failed to fetch dashboard stats');
    }
};

// ------------------------------------------------------------------
// 3. Sync Logic (V2 Implementation)
// ------------------------------------------------------------------

const syncCompetition = async (req, res) => {
    try {
        const competitionId = req.params.competitionId || req.body.competitionId; // Check params first, then body
        const facultyId = req.user.id;
        const { department_id, assigned_sections } = req.user;

        console.log(`[Faculty] Sync requested for competition ${competitionId} by faculty ${facultyId}`);

        // Validate competition
        const { data: competition, error: compError } = await supabase
            .from('competitions')
            .select('id, title, uploaded_at, last_synced_at, is_syncing, created_at')
            .eq('id', competitionId)
            .single();

        if (compError || !competition) {
            return sendResponse(res, 404, null, 'Competition not found');
        }

        // Sync Lock Check
        if (competition.is_syncing) {
            return sendResponse(res, 409, null, 'Sync already in progress');
        }

        // Need department_id and assigned_sections. 
        // We trust req.user populated by middleware.

        console.log(`[Faculty] Syncing via shared batch logic`);

        // Perform V2 Gmail sync using shared participation controller logic
        const { stats, logs } = await performBatchSync(competition, department_id, assigned_sections, facultyId);

        const response = {
            competitionTitle: competition.title,
            syncWindow: {
                from: new Date(competition.last_synced_at || competition.uploaded_at || competition.created_at).toLocaleString(),
                to: new Date().toLocaleString()
            },
            results: stats,
            details: logs,
            message: `Sync completed successfully.`
        };

        sendResponse(res, 200, response, 'Gmail sync completed');

    } catch (error) {
        console.error('[Faculty] Sync failed:', error);
        sendResponse(res, 500, null, `Sync failed: ${error.message}`);
    }
};

const getCompetitionSyncStatus = async (req, res) => {
    try {
        // Get all active competitions
        const { data: competitions, error: compError } = await supabase
            .from('competitions')
            .select('id, title, uploaded_at, last_synced_at, registration_deadline')
            .gte('registration_deadline', new Date().toISOString().split('T')[0])
            .order('uploaded_at', { ascending: false });

        if (compError) throw compError;

        const competitionsWithStatus = competitions.map(comp => ({
            id: comp.id,
            title: comp.title,
            uploadedAt: comp.uploaded_at ? new Date(comp.uploaded_at).toLocaleString() : 'N/A',
            lastSyncedAt: comp.last_synced_at ? new Date(comp.last_synced_at).toLocaleString() : null,
            registrationDeadline: comp.registration_deadline,
            syncStatus: comp.last_synced_at ? 'Synced' : 'Never Synced',
            canSync: true,
            nextSyncFrom: comp.last_synced_at
                ? new Date(comp.last_synced_at).toLocaleString()
                : (comp.uploaded_at ? new Date(comp.uploaded_at).toLocaleString() : 'N/A')
        }));

        sendResponse(res, 200, competitionsWithStatus, 'Competition sync status fetched');

    } catch (error) {
        console.error('[Faculty] Sync status error:', error);
        sendResponse(res, 500, null, 'Failed to fetch sync status');
    }
};

// ------------------------------------------------------------------
// 4. Student Details (V2 Status Resolution)
// ------------------------------------------------------------------

const getStudentDetails = async (req, res) => {
    // Replaced with V2 Logic (Status Resolution: WON > QUALIFIED > REGISTERED)
    try {
        const { studentId } = req.params;
        const facultyId = req.user.id;
        const { assigned_sections, department_id } = req.user;

        // 1. Validate Student & Access
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('id, full_name, registration_no, email, phone_number, department_id, section, cgpa, departments(name)')
            .eq('id', studentId)
            .single();

        if (studentError || !student) {
            return sendResponse(res, 404, null, 'Student not found');
        }

        if (student.department_id !== department_id) {
            return sendResponse(res, 403, null, 'Unauthorized access (Dept mismatch)');
        }

        // Verify Section Access (Case Insensitive)
        const allowedSections = (assigned_sections || []).map(s => {
            const parts = s.split('-');
            const sec = parts.length > 1 ? parts[1] : s;
            return sec.trim().toUpperCase();
        }).filter(s => s !== '');

        const studentSec = (student.section || '').trim().toUpperCase();
        if (!allowedSections.includes(studentSec)) {
            return sendResponse(res, 403, null, 'Unauthorized access (Section mismatch)');
        }

        // 2. Fetch Data
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
                id, registered_at, verified, source,
                competitions ( id, title, platform, organizer )
            `)
            .eq('user_id', studentId);

        if (regError) throw regError;

        const { data: statuses, error: statusError } = await supabase
            .from('competition_status')
            .select('competition_id, is_shortlisted, is_winner, updated_at')
            .eq('user_id', studentId);

        if (statusError) throw statusError;

        // 3. Resolve Statuses (V2 Logic)
        const competitionDetails = registrations.map(reg => {
            const statusEntry = statuses?.find(s => s.competition_id === reg.competitions.id);

            let currentStatus = 'Registered';
            if (statusEntry?.is_winner || statusEntry?.is_shortlisted) currentStatus = 'Qualified';

            return {
                id: reg.competitions.id,
                competitionName: reg.competitions.title,
                platform: reg.competitions.platform,
                regType: 'Individual',
                status: currentStatus,
                verificationStatus: reg.verified ? 'Verified' : 'Pending',
                registeredAt: reg.registered_at,
                source: reg.source
            };
        });

        // Calculate Stats
        const stats = {
            registered: registrations.length,
            qualified: competitionDetails.filter(c => c.status === 'Qualified').length,
        };

        // 4. Class Advisor Logic (Robust - matched with HOD controller)
        let classAdvisorName = 'Not Assigned';
        try {
            const { data: deptFaculty, error: facultyError } = await supabase
                .from('users')
                .select('full_name, assigned_sections')
                .eq('role', 'FACULTY')
                .eq('department_id', department_id);

            if (!facultyError && deptFaculty) {
                const advisor = deptFaculty.find(f => {
                    const sections = f.assigned_sections || [];
                    return sections.some(s => {
                        const parsed = s.split('-').pop().trim().toUpperCase();
                        return parsed === studentSec;
                    });
                });
                if (advisor) classAdvisorName = advisor.full_name;
            }
        } catch (err) {
            console.warn('Class advisor lookup failed:', err);
        }

        // Batch Label
        const batchLabel = calculateBatchLabel(student.registration_no);

        const responseData = {
            profile: {
                id: student.id, // Added ID for consistency
                name: student.full_name,
                rollNo: student.registration_no,
                email: student.email,
                department: student.departments.name,
                section: student.section,
                classAdvisor: classAdvisorName,
                batch: batchLabel,
                cgpa: student.cgpa || 'N/A',
                phoneNumber: student.phone_number || 'N/A'
            },
            stats,
            competitions: competitionDetails
        };

        sendResponse(res, 200, responseData, 'Fetched student details');

    } catch (error) {
        console.error('[Faculty] Student details error:', error);
        sendResponse(res, 500, null, 'Failed to fetch student details');
    }
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const getMyStudentIds = async (facultyId, deptId, assignedSections) => {
    try {
        let allStudents = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error } = await supabase
                .from('users')
                .select('id, section')
                .eq('role', 'STUDENT')
                .eq('department_id', deptId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;
            if (pageData.length > 0) {
                allStudents = [...allStudents, ...pageData];
                page++;
                if (pageData.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        // Robust Filtering (Case Insensitive & Format Flexible)
        const allowedSections = new Set();
        (assignedSections || []).forEach(s => {
            if (!s) return;
            const full = s.trim().toUpperCase();
            allowedSections.add(full); // Add 'CSE-A'

            const parts = s.split('-');
            if (parts.length > 1) {
                allowedSections.add(parts.pop().trim().toUpperCase()); // Add 'A'
            }
        });

        const filteredStudents = allStudents.filter(student => {
            const studentSec = (student.section || '').trim().toUpperCase();
            return allowedSections.has(studentSec);
        });

        console.log(`[Faculty] getMyStudentIds: Found ${filteredStudents.length} students out of ${allStudents.length} in dept.`);
        return filteredStudents.map(s => s.id);

    } catch (error) {
        console.error('[Faculty] Error getting student IDs:', error);
        throw error;
    }
};

const calculateBatchLabel = (registrationNo) => {
    if (!registrationNo) return 'N/A';
    let yearShort = null;
    const prefix = registrationNo.substring(0, 2);
    const mid = registrationNo.length >= 6 ? registrationNo.substring(4, 6) : null;
    if (parseInt(prefix) >= 15 && parseInt(prefix) <= 40) yearShort = prefix;
    else if (mid && parseInt(mid) >= 15 && parseInt(mid) <= 40) yearShort = mid;
    if (yearShort) {
        const startYear = 2000 + parseInt(yearShort, 10);
        return `${startYear}-${startYear + 4}`;
    }
    return 'N/A';
};

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
            status: r.status, // Include status for filtering
            source: r.source,
            created_at: r.registered_at
        }));

        sendResponse(res, 200, mappedRegs, 'Fetched pending registrations');
    } catch (err) {
        console.error('[FacultyController] Pending Regs Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error: ' + err.message);
    }
};

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
            .not('shortlist_proof_url', 'is', null) // Only fetching those who UPLOADED
            .order('registered_at', { ascending: false });

        if (error) {
            console.error('[Faculty] Pending Shortlist Query Error:', error);
            throw error;
        }

        // Map to frontend expectation
        const mappedRegs = registrations.map(r => ({
            id: r.id,
            competitions: { title: r.competitions.title },
            users: {
                full_name: r.users.full_name,
                registration_no: r.users.registration_no,
                section: r.users.section
            },
            proof_url: r.shortlist_proof_url, // Map new col to generic 'proof_url' for frontend reuse
            created_at: r.registered_at,
            type: 'SHORTLIST' // Tag for frontend
        }));

        sendResponse(res, 200, mappedRegs, 'Fetched pending shortlists');
    } catch (err) {
        console.error('[FacultyController] Pending Shortlist Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const verifyShortlist = async (req, res) => {
    const { registration_id, action } = req.body; // action: 'approve' or 'reject'

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
                .update({ shortlist_proof_url: null, qualification_verified: false }) // Reset so they can re-upload
                .eq('id', registration_id);
            if (error) throw error;
        }

        sendResponse(res, 200, null, `Shortlist ${action}d successfully`);
    } catch (err) {
        console.error('[Faculty] Verify Shortlist Error:', err);
        sendResponse(res, 500, null, 'Failed to verify');
    }
};

const getPendingTeamVerifications = async (req, res) => {
    try {
        const { assigned_sections, department_id } = req.user;
        const myStudentIds = await getMyStudentIds(req.user.id, department_id, assigned_sections || []);

        if (myStudentIds.length === 0) {
            return sendResponse(res, 200, [], 'No students found');
        }

        // Teams where leader is my student AND status is PENDING
        // Note: 'teams' table structure: id, team_name, leader_id, verification_status, competition_id, proof_url
        const { data: teams, error } = await supabase
            .from('teams')
            .select(`
                id, team_name, verification_status, proof_url, created_at,
                users!teams_leader_id_fkey!inner ( full_name, registration_no, section ),
                competitions!inner ( title )
            `)
            .in('leader_id', myStudentIds)
            .eq('verification_status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to frontend expectation
        const mappedTeams = teams.map(t => ({
            id: t.id,
            competitionName: t.competitions.title,
            leaderName: t.users.full_name,
            leaderRollNo: t.users.registration_no,
            leaderSection: t.users.section,
            teamName: t.team_name,
            proofUrl: t.proof_url,
            submittedAt: t.created_at
        }));

        sendResponse(res, 200, mappedTeams, 'Fetched pending team verifications');

    } catch (err) {
        console.error('[FacultyController] Pending Teams Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const verifyRegistration = async (req, res) => {
    try {
        const { registration_id, action } = req.body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return sendResponse(res, 400, null, 'Invalid action');
        }

        const updates = { verified: action === 'approve' };
        // If rejecting, maybe remove the row? Or keep it as verified=false? 
        // Typically verify=false is default. 
        // If rejected, usually we delete the registration or have a 'REJECTED' status.
        // For 'registrations' table with boolean 'verified', 'reject' might mean deleting it to allow re-upload?
        // Or we need a status column. Current schema seems to be boolean verified.
        // Let's assume verified=true (approve). If reject, maybe delete?

        // Use verifyRegistration logic from v2 controller if available, otherwise:
        if (action === 'approve') {
            const { error } = await supabase
                .from('registrations')
                .update({ verified: true })
                .eq('id', registration_id);
            if (error) throw error;
        } else {
            // Reject -> Delete to allow re-upload
            const { error } = await supabase
                .from('registrations')
                .delete()
                .eq('id', registration_id);
            if (error) throw error;
        }

        sendResponse(res, 200, null, `Registration ${action}ed`);
    } catch (err) {
        console.error('[FacultyController] Verify Error:', err);
        sendResponse(res, 500, null, 'Verification failed');
    }
};

const downloadParticipationReport = async (req, res) => {
    try {
        const { assigned_sections, department_id } = req.user;
        const myStudentIds = await getMyStudentIds(req.user.id, department_id, assigned_sections || []);

        if (myStudentIds.length === 0) {
            return res.status(200).send('No students found related to your assigned sections.');
        }

        // Fetch comprehensive data for the report
        const { data: reportData, error } = await supabase
            .from('registrations')
            .select(`
                registered_at, verified, status,
                users!registrations_user_id_fkey ( full_name, registration_no, section, email, phone_number ),
                competitions!inner ( title, organizer, event_date, platform )
            `)
            .in('user_id', myStudentIds)
            .order('registered_at', { ascending: false });

        if (error) throw error;

        // Generate CSV
        const csvRows = [];
        // Header
        csvRows.push(['Student Name', 'Register No', 'Section', 'Email', 'Phone', 'Competition', 'Organizer', 'Platform', 'Date', 'Status', 'Verified', 'Registered At'].join(','));

        reportData.forEach(r => {
            const row = [
                r.users?.full_name || 'N/A',
                r.users?.registration_no || 'N/A',
                r.users?.section || 'N/A',
                r.users?.email || 'N/A',
                r.users?.phone_number || 'N/A',
                r.competitions?.title || 'N/A',
                r.competitions?.organizer || 'N/A',
                r.competitions?.platform || 'N/A',
                r.competitions?.event_date || 'N/A',
                r.status || 'Pending',
                r.verified ? 'Yes' : 'No',
                new Date(r.registered_at).toLocaleString()
            ].map(field => `"${String(field).replace(/"/g, '""')}"`); // Escape quotes

            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="participation_report_${Date.now()}.csv"`);
        res.status(200).send(csvString);

    } catch (err) {
        console.error('[Faculty] Export Error:', err);
        sendResponse(res, 500, null, 'Failed to export report');
    }
};

module.exports = {
    getMyStudents,
    getRecentRegistrations,
    getDashboardStats,
    getStats,
    syncCompetition,
    getCompetitionSyncStatus,
    getStudentDetails,
    getPendingVerifications,
    getPendingTeamVerifications,
    verifyRegistration,
    getPendingShortlistVerifications,
    verifyShortlist,
    downloadParticipationReport
};
