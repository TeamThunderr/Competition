// File Name: faculty.controller.js
// Purpose: Handle faculty requests
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');
const supabase = require('../../config/supabaseClient');
const statsService = require('../../services/admin/stats.service');

const getMyStudents = async (req, res) => {
    try {
        const { assigned_sections } = req.user;

        if (!assigned_sections || assigned_sections.length === 0) {
            return sendResponse(res, 200, [], 'No sections assigned');
        }

        // Logic: assigned_sections is like ["CSE-A", "CSE-B"]
        // We need to fetch students where (Section is 'A' AND Dept is 'CSE') OR ...
        // Simplification for MVP: We assume unique section names or just filter by section letter string 
        // if the input matches users.section directly.
        // However, user said "CSE-A". The DB has 'section' column (e.g. 'A') and 'departments' table.
        // So we need to parse "CSE-A" -> Dept: CSE, Section: A

        // Let's build a robust query using Supabase OR syntax.
        // Form: section.eq.A,departments.name.eq.CSE, ...
        // But supabase-js 'or' expects a string like "and(section.eq.A,departments.name.eq.CSE),..." which is complex with Joins.

        // ALTERNATIVE SIMPLER APPROACH:
        // Fetch all students in the Faculty's Department (assuming faculty only teaches their own dept for now)
        // AND then filter in memory for Section.
        // This is safe because specific dept student count is low (< 1000).

        const myDeptId = req.user.department_id;


        // PAGINATION LOGIC: Supabase has a hard limit (likely 1000)
        // We need to fetch all pages until we get them all.
        let allStudents = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error: pageError } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    registration_no,
                    section,
                    email,
                    role,
                    departments!inner (
                        name
                    )
                `)
                .eq('role', 'STUDENT')
                .eq('department_id', myDeptId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (pageError) throw pageError;

            if (pageData.length > 0) {
                allStudents = [...allStudents, ...pageData];
                page++;
                // If we got fewer than pageSize, we are done
                if (pageData.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        const students = allStudents;

        // Parse assigned sections to extract just the section letter (e.g., "CSE-A" -> "A")
        // Assumes format "DEPT-SECTION"
        const allowedSections = assigned_sections.map(s => {
            const parts = s.split('-');
            const section = parts.length > 1 ? parts[1].trim() : s.trim(); // Added trim() for safety
            return section;
        });

        console.log(`[FacultyController] Assigned raw: ${JSON.stringify(assigned_sections)}`);
        console.log(`[FacultyController] Allowed parsed: ${JSON.stringify(allowedSections)}`);
        console.log(`[FacultyController] Total students fetched from DB: ${students.length}`);

        const filteredStudents = students.filter(student => {
            const isMatch = allowedSections.includes(student.section);
            if (student.full_name === 'Student 1') {
                console.log(`[FacultyController] Checking Student 1: Section='${student.section}', Match=${isMatch}`);
            }
            return isMatch;
        });

        console.log(`[FacultyController] Final matched students: ${filteredStudents.length}`);

        sendResponse(res, 200, filteredStudents, 'Fetched student list');
    } catch (err) {
        console.error('[FacultyController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const getStats = async (req, res) => {
    try {
        const deptId = req.user.department_id;
        const allStats = await statsService.getDepartmentStats();

        const myStats = allStats.find(d => d.department_id === deptId) || {
            department_name: 'My Department',
            total_registrations: 0,
            verified_registrations: 0,
            sections: []
        };

        sendResponse(res, 200, myStats, 'Fetched faculty stats');
    } catch (err) {
        console.error('[FacultyController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};


// Helper to get list of student IDs for the logged-in faculty
const getMyStudentIds = async (userId, userDeptId, assignedSections) => {
    console.log(`[FacultyDebug] getMyStudentIds called for User: ${userId}, Dept: ${userDeptId}, Sections: ${assignedSections}`);
    // 1. Fetch all students in department
    // PAGINATION LOGIC reused to ensure we get everyone
    let allStudents = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    try {
        while (hasMore) {
            const { data: pageData, error } = await supabase
                .from('users')
                .select('id, section, full_name')
                .eq('role', 'STUDENT')
                .eq('department_id', userDeptId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error('[FacultyDebug] Error fetching students:', error);
                throw error;
            }

            if (pageData.length > 0) {
                allStudents = [...allStudents, ...pageData];
                page++;
                if (pageData.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }
        console.log(`[FacultyDebug] Fetched ${allStudents.length} students from department`);

        // 2. Filter by assigned sections
        const allowedSections = assignedSections.map(s => {
            const parts = s ? s.split('-') : [];
            return parts.length > 1 ? parts[1].trim() : (s ? s.trim() : '');
        }).filter(s => s !== '');

        console.log(`[FacultyDebug] Filtering for sections: ${allowedSections.join(', ')}`);

        const filteredStudents = allStudents.filter(student => allowedSections.includes(student.section));
        console.log(`[FacultyDebug] Found ${filteredStudents.length} matching students`);

        return filteredStudents.map(s => s.id);
    } catch (err) {
        console.error('[FacultyDebug] Error in getMyStudentIds:', err);
        throw err;
    }
};

const getDashboardStats = async (req, res) => {
    console.log('[FacultyDebug] getDashboardStats hit');
    try {
        const { assigned_sections, department_id, id } = req.user;
        console.log(`[FacultyDebug] User context - ID: ${id}, Dept: ${department_id}, Sections:`, assigned_sections);

        const myStudentIds = await getMyStudentIds(id, department_id, assigned_sections || []);

        if (myStudentIds.length === 0) {
            console.log('[FacultyDebug] No students found, returning empty stats');
            return sendResponse(res, 200, {
                total_students: 0,
                comp_registered: 0,
                comp_qualified: 0,
                od_requests: 0,
                section_label: assigned_sections?.[0] || 'N/A'
            }, 'Fetched empty stats');
        }

        // 1. Total Students
        const totalStudents = myStudentIds.length;

        // 2. Comp Registered (Unique user-competition pairs)
        console.log('[FacultyDebug] Fetching registration stats...');
        const { count: registeredCount, error: regError } = await supabase
            .from('registrations')
            .select('id', { count: 'exact', head: true })
            .in('user_id', myStudentIds);

        if (regError) {
            console.error('[FacultyDebug] Registration stats error:', regError);
            throw regError;
        }

        // 3. Comp Qualified
        console.log('[FacultyDebug] Fetching qualification stats...');
        const { count: qualifiedCount, error: qualError } = await supabase
            .from('competition_status')
            .select('id', { count: 'exact', head: true })
            .in('user_id', myStudentIds)
            .eq('is_shortlisted', true);

        if (qualError) {
            console.error('[FacultyDebug] Qualification stats error:', qualError);
            throw qualError;
        }

        // 4. OD Requests (Pending)
        console.log('[FacultyDebug] Fetching OD stats...');
        const { count: odCount, error: odError } = await supabase
            .from('od_requests')
            .select('id', { count: 'exact', head: true })
            .in('user_id', myStudentIds)
            .eq('status', 'PENDING');

        if (odError) {
            console.error('[FacultyDebug] OD stats error:', odError);
            throw odError;
        }

        const stats = {
            total_students: totalStudents,
            comp_registered: registeredCount || 0,
            comp_qualified: qualifiedCount || 0,
            od_requests: odCount || 0,
            section_label: assigned_sections?.join(', ') || 'N/A'
        };

        console.log('[FacultyDebug] Stats compiled:', stats);
        sendResponse(res, 200, stats, 'Fetched dashboard stats');
    } catch (err) {
        console.error('[FacultyController] Error fetching stats:', err);
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
                id,
                registered_at,
                verified,
                users!registrations_user_id_fkey!inner (
                    full_name,
                    registration_no
                ),
                competitions!inner (
                    title,
                    registration_deadline
                )
            `)
            .in('user_id', myStudentIds)
            .order('registered_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Map to UI friendly format
        const mappedRegs = registrations.map(r => ({
            id: r.id,
            studentName: r.users.full_name,
            regNo: r.users.registration_no,
            competition: r.competitions.title,
            deadline: r.competitions.registration_deadline,
            status: r.verified ? 'Verified' : 'Pending', // Simple status logic
            registeredAt: r.registered_at
        }));

        sendResponse(res, 200, mappedRegs, 'Fetched recent registrations');

    } catch (err) {
        console.error('[FacultyController] Error fetching registrations:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const getStudentDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { assigned_sections, department_id, id: facultyId } = req.user;

        console.log(`[FacultyDebug] getStudentDetails - Faculty: ${facultyId} Dept: ${department_id} Student: ${studentId}`);
        console.log(`[FacultyDebug] Assigned Sections (Raw):`, assigned_sections);

        // 1a. Validate UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(studentId)) {
            console.warn(`[FacultyDebug] Invalid UUID: ${studentId}`);
            return sendResponse(res, 400, null, 'Invalid Student ID format');
        }

        // 1b. Fetch Student
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('id, full_name, registration_no, email, department_id, section, departments(name)')
            .eq('id', studentId)
            .single();

        if (studentError || !student) {
            console.error(`[FacultyDebug] Student fetch error or not found:`, studentError);
            return sendResponse(res, 404, null, 'Student not found');
        }

        console.log(`[FacultyDebug] Fetched Student: ID=${student.id}, Dept=${student.department_id}, Section=${student.section}`);

        // 1c. Verify Department
        if (student.department_id !== department_id) {
            console.warn(`[FacultyDebug] Dept Mismatch: FacultyDept=${department_id}, StudentDept=${student.department_id}`);
            return sendResponse(res, 403, null, 'Unauthorized: Student belongs to another department');
        }

        // 1d. Verify Section
        // Parse assigned sections - handle "CSE-A" -> "A" and plain "A". Case insensitive.
        const allowedSections = (assigned_sections || []).map(s => {
            if (!s) return '';
            const parts = s.split('-');
            // If "CSE-A", take "A". If "A", take "A".
            return (parts.length > 1 ? parts[1] : parts[0]).trim().toUpperCase();
        }).filter(s => s !== '');

        const studentSection = (student.section || '').trim().toUpperCase();

        console.log(`[FacultyDebug] Allowed Sections (Parsed): ${JSON.stringify(allowedSections)}`);
        console.log(`[FacultyDebug] Student Section (Parsed): '${studentSection}'`);

        if (!allowedSections.includes(studentSection)) {
            console.warn(`[FacultyDebug] Section Mismatch! Allowed: ${allowedSections}, Got: ${studentSection}`);
            return sendResponse(res, 403, null, 'Unauthorized: Student is not in your assigned sections');
        }

        // 2. Fetch Registrations & Competitions
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
                id,
                registered_at,
                verified,
                competitions (
                    id,
                    title,
                    platform
                )
            `)
            .eq('user_id', studentId);

        if (regError) throw regError;

        // 3. Fetch Status (Qualified/Won)
        const { data: statuses, error: statusError } = await supabase
            .from('competition_status')
            .select('*')
            .eq('user_id', studentId);

        if (statusError) throw statusError;

        // 4. Fetch Class Advisor (Faculty for this section)
        // Find faculty in same dept whose assigned_sections (array) string-contains the student section.
        // Since SQL 'contains' is strict on JSON array elements, and our format varies (CSE-A vs A),
        // we'll fetch keys and filter in memory or use a broad text search.
        // Simplest: Fetch all faculty in dept, find match. (Faculty count is small < 50 usually)

        let classAdvisorName = 'Not Assigned';
        const { data: deptFaculty, error: facultyError } = await supabase
            .from('users')
            .select('full_name, assigned_sections')
            .eq('role', 'FACULTY')
            .eq('department_id', department_id);

        if (!facultyError && deptFaculty) {
            const advisor = deptFaculty.find(f => {
                const sections = f.assigned_sections || [];
                // Check if any assigned section matches student section (fuzzy match for 'A' vs 'CSE-A')
                return sections.some(s => {
                    const parsed = s.split('-').pop().trim().toUpperCase();
                    return parsed === studentSection;
                });
            });
            if (advisor) classAdvisorName = advisor.full_name;
        }

        // Aggregate Data
        const competitionDetails = registrations.map(reg => {
            const statusEntry = statuses?.find(s => s.competition_id === reg.competitions.id);

            let status = 'Registered';
            const isVerified = reg.verified;

            if (statusEntry?.is_shortlisted) status = 'Qualified';
            if (statusEntry?.is_winner) status = 'Won';

            return {
                id: reg.competitions.id,
                competitionName: reg.competitions.title,
                platform: reg.competitions.platform || 'N/A',
                regType: 'Individual',
                status: status,
                verificationStatus: isVerified ? 'Verified' : 'Pending',
                registeredAt: reg.registered_at
            };
        });

        const stats = {
            registered: registrations.length,
            qualified: statuses?.filter(s => s.is_shortlisted).length || 0,
            won: statuses?.filter(s => s.is_winner).length || 0,
        };

        const responseData = {
            profile: {
                name: student.full_name,
                rollNo: student.registration_no,
                email: student.email,
                department: student.departments.name,
                section: student.section,
                classAdvisor: classAdvisorName
            },
            stats,
            competitions: competitionDetails
        };

        sendResponse(res, 200, responseData, 'Fetched student details');

    } catch (err) {
        console.error('[FacultyController] Error fetching student details:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

module.exports = { getMyStudents, getStats, getDashboardStats, getRecentRegistrations, getStudentDetails };

