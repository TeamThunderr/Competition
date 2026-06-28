// File Name: hod.controller.js
// Purpose: Handle HOD requests
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');
const supabase = require('../../config/supabaseClient');
const statsService = require('../../services/admin/stats.service');
const { getAcademicYearLabel } = require('../../utils/academicYear.util');

const getDepartmentStats = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;
        console.log(`[HodController] Fetching stats for Dept: ${hodDeptId}`);

        // 1. Fetch ALL Student IDs in this Dept (Pagination for >1000 students)
        console.log('[HodController] Step 1: Fetching students (paginated)...');
        let deptStudents = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
            const { data, error } = await supabase
                .from('users')
                .select('id, section')
                .eq('role', 'STUDENT')
                .eq('department_id', hodDeptId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error('[HodController] Step 1 Error:', error);
                throw error;
            }

            if (data.length > 0) {
                deptStudents = [...deptStudents, ...data];
                if (data.length < pageSize) hasMore = false;
                page++;
            } else {
                hasMore = false;
            }
        }

        const studentCount = deptStudents.length;
        const studentIds = deptStudents.map(u => u.id);

        // Calculate Unique Sections
        const uniqueSections = [...new Set(deptStudents.map(u => u.section).filter(Boolean))].length;

        // 2. Active Competitions (Standard check)
        console.log('[HodController] Step 2: Fetching active competitions...');
        const now = new Date().toISOString();
        const { count: activeCompCount, error: compError } = await supabase
            .from('competitions')
            .select('id', { count: 'exact', head: true })
            .gt('registration_deadline', now);

        if (compError) {
            console.error('[HodController] Step 2 Error:', compError);
            throw compError;
        }

        // 3. Shortlisted Students (Filter by Student IDs)
        let shortlistedCount = 0;
        console.log('[HodController] Step 3: Fetching shortlisted count (optimized join)...');
        // Join with users table to filter by department_id
        const { count: sCount, error: shortError } = await supabase
            .from('competition_status')
            .select('users!user_id!inner(department_id)', { count: 'exact', head: true })
            .eq('is_shortlisted', true)
            .eq('users.department_id', hodDeptId);

        if (shortError) {
            console.error('[HodController] Step 3 Error:', shortError);
            throw shortError;
        }
        shortlistedCount = sCount || 0;

        // 4. Pending OD Requests (Filter by Student IDs)
        let odCount = 0;
        console.log('[HodController] Step 4: Fetching pending OD requests (optimized join)...');
        // Use user_id FK to filter by requester's department
        const { count: oCount, error: odError } = await supabase
            .from('od_requests')
            .select('users!user_id!inner(department_id)', { count: 'exact', head: true })
            .eq('status', 'PENDING')
            .eq('users.department_id', hodDeptId);

        if (odError) {
            console.error('[HodController] Step 4 Error:', odError);
            console.error('[HodController] Step 4 full error:', JSON.stringify(odError));
            throw odError;
        }
        odCount = oCount || 0;

        const stats = [
            { label: 'TOTAL DEPT. STUDENTS', value: studentCount.toString(), subtext: `Across ${uniqueSections} Sections`, borderLeft: 'border-l-4 border-blue-500' },
            { label: 'ACTIVE COMPETITIONS', value: (activeCompCount || 0).toString(), subtext: 'Ongoing this semester', borderLeft: '' },
            { label: 'SHORTLISTED STUDENTS', value: shortlistedCount.toString(), subtext: 'Qualified Round 1', borderLeft: '' },
            { label: 'PENDING OD REQUESTS', value: odCount.toString(), subtext: 'Requires Immediate Action', borderLeft: '' },
        ];

        // 6. Detailed Section Analytics (Replacing Mock Data)
        // We need: Section Name | Total Students | Registered count | Qualified count | Pending OD count

        // Fetch all students in dept with their registration/status/OD info
        // This is a bit heavy, so we might want to optimize later, but for < 1000 students it's fine.
        // Fetch all students in dept with their registration/status/OD info
        console.log('[HodController] Step 6: Fetching detailed analytics (paginated)...');
        let analyticsUsers = [];
        let aPage = 0;
        let aHasMore = true;

        while (aHasMore) {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, section, role, admission_year,
                    registrations:registrations!user_id ( id, verified ),
                    competition_status:competition_status!user_id ( is_shortlisted, is_winner ),
                    od_requests:od_requests!user_id ( status )
                `)
                .eq('department_id', hodDeptId)
                .eq('role', 'STUDENT')
                .range(aPage * pageSize, (aPage + 1) * pageSize - 1);

            if (error) {
                console.error('[HodController] Step 6 Error:', error);
                throw error;
            }

            if (data.length > 0) {
                analyticsUsers = [...analyticsUsers, ...data];
                if (data.length < pageSize) aHasMore = false;
                aPage++;
            } else {
                aHasMore = false;
            }
        }

        // Process Analytics
        const sectionMap = {};

        // Fetch Faculty for Class Advisor Mapping
        const { data: facultyData } = await supabase
            .from('users')
            .select('full_name, assigned_sections')
            .eq('role', 'FACULTY')
            .eq('department_id', hodDeptId);

        analyticsUsers.forEach(u => {
            const sec = u.section || 'Unassigned';

            // Determine Academic Year
            const academicYearLabel = getAcademicYearLabel(u.admission_year);

            // ONLY ALLOW 2nd AND 3rd YEAR STUDENTS
            if (academicYearLabel !== '2nd Year' && academicYearLabel !== '3rd Year') {
                return; // Skip this student
            }

            // Composite Key to separate A (2nd Year) from A (3rd Year)
            const mapKey = `${sec}-${academicYearLabel}`;

            if (!sectionMap[mapKey]) {
                const batch = u.admission_year ? `${u.admission_year}-${u.admission_year + 4}` : 'N/A';

                // Find Faculty Advisor
                let facultyNames = [];
                if (facultyData) {
                    const advisors = facultyData.filter(f => {
                        const sections = f.assigned_sections || [];
                        return sections.some(s => {
                            if (!s) return false;

                            // Normalize strings
                            const cleanAssigned = s.toString().trim().toUpperCase();
                            const cleanTarget = sec.toString().trim().toUpperCase(); // 'A', 'B', 'CSE-A'

                            // 1. Direct Exact Match
                            if (cleanAssigned === cleanTarget) return true;

                            // 2. Suffix Match (Most common: 'CSE-A' matches 'A')
                            // Check for separators: '-', ' ', '_'
                            const separators = ['-', ' ', '_', ':'];
                            for (const sep of separators) {
                                if (cleanAssigned.endsWith(`${sep}${cleanTarget}`)) return true;
                                if (cleanTarget.endsWith(`${sep}${cleanAssigned}`)) return true;
                            }

                            // 3. Last Word Match (e.g. "Year 2 Section A" matches "A")
                            const assignedParts = cleanAssigned.split(/[\s-_]+/);
                            const targetParts = cleanTarget.split(/[\s-_]+/);
                            const lastAssigned = assignedParts[assignedParts.length - 1];
                            const lastTarget = targetParts[targetParts.length - 1];

                            if (lastAssigned === cleanTarget) return true;
                            if (lastTarget === cleanAssigned) return true;
                            if (lastAssigned === lastTarget) return true;

                            return false;
                        });
                    });

                    if (advisors.length > 0) {
                        facultyNames = advisors.map(a => a.full_name);
                    }
                }

                // Format Advisor String
                let advisorString = 'Not Assigned';
                if (facultyNames.length > 0) {
                    advisorString = facultyNames.join(', ');
                }

                sectionMap[mapKey] = {
                    section: sec,
                    batch: batch,
                    academicYear: academicYearLabel,
                    classAdvisor: advisorString,
                    totalStudents: 0,
                    registered: 0,
                    qualified: 0,
                    pending: 0
                };
            }

            const s = sectionMap[mapKey];
            s.totalStudents++;

            // Registered: Has at least one registration
            if (u.registrations && u.registrations.length > 0) s.registered++;

            // Qualified: Has at least one shortlisted status
            if (u.competition_status && u.competition_status.some(cs => cs.is_shortlisted || cs.is_winner)) s.qualified++;

            // Pending OD: Has pending requests
            if (u.od_requests && u.od_requests.some(od => od.status === 'PENDING')) s.pending++;
        });

        const sectionAnalytics = Object.values(sectionMap).sort((a, b) => {
            // Sort by Year (desc) then Section (asc)
            if (a.academicYear !== b.academicYear) return a.academicYear.localeCompare(b.academicYear);
            return a.section.localeCompare(b.section, undefined, { numeric: true });
        });

        sendResponse(res, 200, {
            cards: stats,
            sections: sectionAnalytics
        }, 'Fetched department stats and analytics');
    } catch (err) {
        console.error('[HodController] Full Error Object:', JSON.stringify(err, null, 2));
        // Send the actual error message to help debug (though in prod we hide it)
        sendResponse(res, 500, null, `Internal Server Error: ${err.message || 'Unknown error'}`);
    }
};

const getDepartmentUsers = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;
        const { year } = req.query; // '2nd', '3rd', '4th'

        console.log(`[HodController] Fetching users for Dept: ${hodDeptId}, Year: ${year || 'All'}`);

        // Calculate admission year if year filter is present
        let targetAdmissionYear = null;
        if (year) {
            const { getCurrentAcademicYear } = require('../../utils/academicYear.util');
            const currentYear = getCurrentAcademicYear();
            const yearNum = parseInt(year); // Extract number from '2nd', '3rd'
            if (!isNaN(yearNum)) {
                targetAdmissionYear = currentYear - (yearNum - 1);
            }
        }

        // Fetch all users (Students & Faculty) in the same department
        // PAGINATION LOGIC
        let allUsers = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            let query = supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    role,
                    section,
                    registration_no,
                    assigned_sections,
                    admission_year, 
                    departments!inner (
                        name
                    ),
                    registrations:registrations!user_id (
                        id
                    )
                `)
                .eq('department_id', hodDeptId);

            // Apply Year Filter
            if (targetAdmissionYear) {
                query = query.eq('admission_year', targetAdmissionYear);
            }

            const { data: pageData, error: pageError } = await query
                .order('role', { ascending: true })
                .order('section', { ascending: true })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (pageError) throw pageError;

            if (pageData.length > 0) {
                allUsers = [...allUsers, ...pageData];
                page++;
                if (pageData.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        const { getAcademicYearLabel } = require('../../utils/academicYear.util');
        
        const users = allUsers.filter(u => {
            if (u.role !== 'STUDENT') return true; // Keep faculty/HOD
            const label = getAcademicYearLabel(u.admission_year);
            return label === '2nd Year' || label === '3rd Year';
        });

        sendResponse(res, 200, users, 'Fetched department users');
    } catch (err) {
        console.error('[HodController] Error fetching department users:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const getDepartmentAnalytics = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;

        // 1. Overall Stats (Total Students, Participants, Shortlisted, Winners)
        // We use inner join on users to filter by department
        const { data: deptStats, error: statsError } = await supabase
            .from('competition_status')
            .select(`
                is_shortlisted, 
                is_winner,
                users!user_id!inner(department_id)
            `)
            .eq('users.department_id', hodDeptId);

        if (statsError) throw statsError;

        const totalParticipations = deptStats.length;
        const totalShortlisted = deptStats.filter(s => s.is_shortlisted).length;
        const totalWinners = deptStats.filter(s => s.is_winner).length;

        // Qualification Rate
        const qualificationRate = totalParticipations > 0
            ? ((totalShortlisted / totalParticipations) * 100).toFixed(1)
            : 0;

        // 2. ROI Analysis (Competition-wise breakdown)
        // We want to know which competitions have the most participation/success from this dept
        const { data: roiData, error: roiError } = await supabase
            .from('competitions')
            .select(`
                id, title, event_date,
                registrations!inner(
                    users!inner(department_id)
                ),
                competition_status(
                    is_shortlisted,
                    is_winner,
                    users!user_id!inner(department_id)
                )
            `)
            .eq('registrations.users.department_id', hodDeptId)
        // Note: Supabase filtering on nested resources can be tricky. 
        // We'll fetch relevant competitions and filter in memory if needed or rely on the inner join constraints.
        // A simpler approach for ROI is fetching all competitions that have at least one registration from this dept.

        // Alternative ROI Query: Fetch competitions, then counts. 
        // Let's try a direct approach: get all status entries for this dept, joined with competition details.
        const { data: compStats, error: compError } = await supabase
            .from('competition_status')
            .select(`
                competition_id,
                is_shortlisted,
                is_winner,
                competitions ( id, title, event_date ),
                users!user_id!inner(department_id)
            `)
            .eq('users.department_id', hodDeptId);

        if (compError) throw compError;

        // Aggregate by Competition
        const compMap = {};
        compStats.forEach(item => {
            const cId = item.competition_id;
            const title = item.competitions?.title || 'Unknown';

            if (!compMap[cId]) {
                compMap[cId] = {
                    id: cId,
                    title: title,
                    participants: 0,
                    qualified: 0,
                    winners: 0
                };
            }

            compMap[cId].participants++;
            if (item.is_shortlisted) compMap[cId].qualified++;
            if (item.is_winner) compMap[cId].winners++;
        });

        const roiAnalysis = Object.values(compMap).map(c => ({
            ...c,
            impactScore: (c.qualified * 2) + (c.winners * 5), // Arbitrary score: 2pts for shortlist, 5pts for win
            conversionRate: c.participants > 0 ? ((c.qualified / c.participants) * 100).toFixed(1) : 0
        })).sort((a, b) => b.impactScore - a.impactScore);


        // 3. Growth Trend (Simulated for now based on event_date)
        // In a real app, we'd group `registrations.created_at` by month.
        // For now, we'll return an empty structure or implied trend.

        sendResponse(res, 200, {
            metrics: {
                qualificationRate,
                totalWins: totalWinners,
                activeParticipants: totalParticipations // This is technically "total registrations", distinct users would require a Set
            },
            roi: roiAnalysis,
            growth: [] // Todo
        }, 'Fetched department analytics');

    } catch (err) {
        console.error('[HodController] Analytics Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

const getDashboardAnalysis = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;
        console.log(`[HodController] Analysis for Dept: ${hodDeptId}`);

        // 1. Fetch Processed Data for Analysis
        console.log('[HodController] Step 1: Fetching all users...');
        // We need all students to calculate batches and years.
        let allUsers = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, role, admission_year, cgpa, registration_no')
                .eq('department_id', hodDeptId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error('[HodController] Step 1 Error:', error);
                throw error;
            }
            if (data.length > 0) {
                allUsers = [...allUsers, ...data];
                page++;
                if (data.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }
        console.log(`[HodController] Step 1 Done. Fetched ${allUsers.length} users.`);

        const students = allUsers.filter(u => u.role === 'STUDENT');
        const facultyCount = allUsers.filter(u => u.role === 'FACULTY').length;
        const studentIds = students.map(s => s.id);

        // 2. Fetch Aggregated Registration Stats (With Details for Analytics)
        console.log('[HodController] Step 2: Fetching detailed registration data...');

        let allRegistrations = [];

        if (studentIds.length > 0) {
            const chunkSize = 50;
            for (let i = 0; i < studentIds.length; i += chunkSize) {
                const chunk = studentIds.slice(i, i + chunkSize);

                const { data: regData, error: regError } = await supabase
                    .from('registrations')
                    .select(`
                        id, 
                        user_id, 
                        verified, 
                        registered_at,
                        competition_id,
                        competitions ( title )
                    `)
                    .in('user_id', chunk);

                if (regError) {
                    console.error('[HodController] Step 2 Reg Error in Chunk:', regError);
                    throw regError;
                }

                if (regData) {
                    allRegistrations = [...allRegistrations, ...regData];
                }
            }
        }
        console.log(`[HodController] Step 2 Done. Fetched ${allRegistrations.length} registrations.`);

        // --- PROCESSING ANALYTICS IN MEMORY ---

        // A. Summary Metrics
        const totalRegistrations = allRegistrations.length;
        const verifiedRegistrations = allRegistrations.filter(r => r.verified).length;
        const pendingVerifications = allRegistrations.filter(r => !r.verified).length;

        // B. At-Risk Students (CGPA < 6.5 AND 0 Participation)
        // Create a Set of active participants
        const participatingStudentIds = new Set(allRegistrations.map(r => r.user_id));

        const atRiskStudents = students.filter(s => {
            const cgpa = parseFloat(s.cgpa || 0);
            const hasParticipated = participatingStudentIds.has(s.id);
            // Threshold: CGPA < 6.5 (if CGPA exists) AND No Participation
            // Note: If CGPA is null/0, we might consider them at risk or missing data. 
            // Let's assume strict check: s.cgpa must be present and < 6.5.
            return (s.cgpa && cgpa < 6.5) && !hasParticipated;
        }).map(s => ({
            id: s.id,
            name: s.full_name,
            regNo: s.registration_no,
            cgpa: s.cgpa,
            batch: s.admission_year ? `${s.admission_year}-${s.admission_year + 4}` : 'N/A'
        }));

        // C. Participation Trends (Monthly)
        // Group by Month-Year (e.g., "Oct 2024")
        const trendMap = {};
        allRegistrations.forEach(r => {
            const date = new Date(r.created_at || r.registered_at); // specific fallback
            const key = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', year: 'numeric' }); // e.g., "Dec 2024"
            if (!trendMap[key]) trendMap[key] = { name: key, date: date, count: 0 };
            trendMap[key].count++;
        });

        // Sort by date
        const participationTrend = Object.values(trendMap)
            .sort((a, b) => a.date - b.date)
            .map(t => ({ name: t.name, count: t.count }));


        // D. Top Competitions
        const compMap = {};
        allRegistrations.forEach(r => {
            const title = r.competitions?.title || 'Unknown Competition';
            if (!compMap[title]) compMap[title] = 0;
            compMap[title]++;
        });

        const topCompetitions = Object.entries(compMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Start with Top 5


        // E. Batch & Academic Year Stats (Existing Logic optimized)
        console.log('[HodController] Step 3: Processing batch/year stats...');
        const batchMap = {};
        const yearMap = {
            '2nd Year': { count: 0, totalCgpa: 0, studentsWithCgpa: 0 },
            '3rd Year': { count: 0, totalCgpa: 0, studentsWithCgpa: 0 },
            '4th Year': { count: 0, totalCgpa: 0, studentsWithCgpa: 0 },
        };

        students.forEach(s => {
            // Batch Stats
            const batchLabel = s.admission_year ? `${s.admission_year}-${s.admission_year + 4}` : 'Unknown';

            const academicYearLabel = getAcademicYearLabel(s.admission_year);

            // ONLY ALLOW 2nd AND 3rd YEAR STUDENTS
            if (academicYearLabel !== '2nd Year' && academicYearLabel !== '3rd Year') {
                return;
            }

            if (!batchMap[batchLabel]) batchMap[batchLabel] = 0;
            batchMap[batchLabel]++;

            // Academic Year Stats
            const academicYear = academicYearLabel;

            if (academicYear && yearMap[academicYear]) {
                yearMap[academicYear].count++;
                if (s.cgpa) {
                    yearMap[academicYear].totalCgpa += parseFloat(s.cgpa);
                    yearMap[academicYear].studentsWithCgpa++;
                }
            }
        });

        const batchStats = Object.keys(batchMap).map(key => ({
            name: key, // for XAxis
            students: batchMap[key]
        })).sort((a, b) => b.name.localeCompare(a.name));

        const academicStats = Object.keys(yearMap).map(key => ({
            year: key,
            count: yearMap[key].count,
            avgCgpa: yearMap[key].studentsWithCgpa > 0
                ? (yearMap[key].totalCgpa / yearMap[key].studentsWithCgpa).toFixed(2)
                : 'N/A'
        }));

        console.log('[HodController] Step 3 Done. Sending response.');

        sendResponse(res, 200, {
            summary: {
                totalStudents: students.length,
                totalFaculty: facultyCount,
                totalCompetitions: totalRegistrations || 0,
                verifiedSubmissions: verifiedRegistrations || 0,
                pendingVerifications: pendingVerifications || 0
            },
            batchStats,
            academicStats,
            atRiskStudents,
            participationTrend,
            topCompetitions
        }, 'Fetched dashboard analysis');

    } catch (err) {
        console.error('[HodController] Dashboard Analysis Error:', err);
        sendResponse(res, 500, null, `Internal Server Error: ${err.message}`);
    }
};


const getStudentDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { department_id } = req.user;

        console.log(`[HodController] getStudentDetails hit for StudentID: ${studentId}`);

        // 1. Validate UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(studentId)) {
            return sendResponse(res, 400, null, 'Invalid Student ID format');
        }

        // 1b. Fetch Student
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('id, full_name, registration_no, email, phone_number, department_id, section, cgpa, departments(name)')
            .eq('id', studentId)
            .single();

        if (studentError || !student) {
            return sendResponse(res, 404, null, 'Student not found');
        }

        // 3. Verify Department (Strict Access Control)
        if (student.department_id !== department_id) {
            return sendResponse(res, 403, null, 'Unauthorized: Student belongs to another department');
        }

        // 4. Fetch Registrations & Competitions
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

        // 5. Fetch Status (Qualified/Won)
        const { data: statuses, error: statusError } = await supabase
            .from('competition_status')
            .select('*')
            .eq('user_id', studentId);

        if (statusError) throw statusError;

        // 6. Fetch Class Advisor
        let classAdvisorName = 'Not Assigned';
        const studentSection = (student.section || '').trim().toUpperCase();

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

        // Calculate Batch
        let batchLabel = 'N/A';
        if (student.registration_no) {
            const regNo = student.registration_no;
            let yearShort = null;
            const prefix = regNo.substring(0, 2);
            const mid = regNo.length >= 6 ? regNo.substring(4, 6) : null;

            if (parseInt(prefix) >= 15 && parseInt(prefix) <= 40) {
                yearShort = prefix;
            } else if (mid && parseInt(mid) >= 15 && parseInt(mid) <= 40) {
                yearShort = mid;
            }

            if (yearShort) {
                const startYear = 2000 + parseInt(yearShort, 10);
                const endYear = startYear + 4;
                batchLabel = `${startYear}-${endYear}`;
            }
        }

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
                classAdvisor: classAdvisorName,
                batch: batchLabel,
                cgpa: student.cgpa || 'N/A',
                phoneNumber: student.phone_number || 'N/A'
            },
            stats,
            competitions: competitionDetails
        };

        sendResponse(res, 200, responseData, 'Fetched student details');

    } catch (err) {
        console.error('[HodController] Error fetching student details:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};


const getDepartmentFaculty = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;
        console.log(`[HodController] Fetching faculty for Dept: ${hodDeptId}`);

        // 1. Fetch All Faculty
        const { data: faculty, error: facultyError } = await supabase
            .from('users')
            .select('id, full_name, email, phone_number, assigned_sections')
            .eq('role', 'FACULTY')
            .eq('department_id', hodDeptId);

        if (facultyError) throw facultyError;

        // 2. Fetch Student Counts per Section for Stats calculation (Paginated)
        // We need section AND admission_year to breakdown by year
        let allStudents = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
            const { data, error } = await supabase
                .from('users')
                .select('section, admission_year')
                .eq('role', 'STUDENT')
                .eq('department_id', hodDeptId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;

            if (data.length > 0) {
                allStudents = [...allStudents, ...data];
                page++;
                if (data.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        // Pre-calculate section counts with Year Breakdown
        // Structure: sectionCounts["A"] = { total: 45, byYear: { "2nd Year": 20, "3rd Year": 25 } }
        const sectionCounts = {};
        const { getAcademicYearLabel } = require('../../utils/academicYear.util');

        allStudents.forEach(s => {
            if (s.section) {
                const sec = s.section.trim().toUpperCase();

                // Determine Year
                const academicYear = getAcademicYearLabel(s.admission_year);

                if (!sectionCounts[sec]) {
                    sectionCounts[sec] = { total: 0, byYear: {} };
                }

                sectionCounts[sec].total++;
                sectionCounts[sec].byYear[academicYear] = (sectionCounts[sec].byYear[academicYear] || 0) + 1;
            }
        });

        // 3. Map Faculty Data with Stats
        const facultyList = faculty.map(f => {
            const sections = f.assigned_sections || [];

            let totalStudents = 0;
            let yearBreakdown = {};

            const cleanSections = sections.map(s => {
                // Logic: Extract the last part "A" from "CSE-A"
                const activeSec = s.split('-').pop().trim().toUpperCase();

                const stats = sectionCounts[activeSec];
                if (stats) {
                    totalStudents += stats.total;
                    // Aggregate years
                    Object.entries(stats.byYear).forEach(([year, count]) => {
                        yearBreakdown[year] = (yearBreakdown[year] || 0) + count;
                    });
                }

                return s;
            });

            return {
                id: f.id,
                name: f.full_name,
                email: f.email,
                phone: f.phone_number || 'N/A',
                designation: f.designation || 'Assistant Professor', // Default falllback
                sections: cleanSections,
                stats: {
                    studentsCount: totalStudents,
                    sectionsCount: sections.length,
                    yearBreakdown: yearBreakdown // New detailed breakdown
                },
                avatar: null
            };
        });

        // Sort by Section (First assigned) then Name
        facultyList.sort((a, b) => {
            const secA = a.sections[0] || 'ZZ';
            const secB = b.sections[0] || 'ZZ';
            if (secA !== secB) return secA.localeCompare(secB, undefined, { numeric: true });
            return a.name.localeCompare(b.name);
        });

        sendResponse(res, 200, facultyList, 'Fetched department faculty');

    } catch (err) {
        console.error('[HodController] Error fetching faculty:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};


const exportWinnersCsv = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;
        console.log(`[HodController] Exporting winners for Dept: ${hodDeptId}`);

        // Fetch Winners with details
        // We use !inner on users to filter by HOD's department
        const { data: winners, error } = await supabase
            .from('competition_status')
            .select(`
                is_winner,
                users!inner (full_name, registration_no, section, department_id, admission_year),
                competitions (title, event_date, organizer)
            `)
            .eq('is_winner', true)
            .eq('users.department_id', hodDeptId);

        if (error) throw error;

        // Generate CSV
        const header = ['Student Name', 'Reg No', 'Section', 'Year', 'Competition', 'Organizer', 'Date'];
        const rows = winners.map(w => {
            const u = w.users;
            const c = w.competitions;

            // Calculate Year
            const { getAcademicYearLabel } = require('../../utils/academicYear.util');
            const yearLabel = getAcademicYearLabel(u.admission_year);

            return [
                `"${u.full_name}"`,
                `"${u.registration_no || ''}"`,
                `"${u.section || ''}"`,
                `"${yearLabel} Year"`,
                `"${c.title}"`,
                `"${c.organizer || ''}"`,
                `"${c.event_date || ''}"`
            ].join(',');
        });

        const csvString = [header.join(','), ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="winners_report.csv"');
        res.status(200).send(csvString);

    } catch (err) {
        console.error('[HodController] Error exporting CSV:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

module.exports = {
    getDepartmentStats,
    getDepartmentUsers,
    getDepartmentAnalytics,
    getDashboardAnalysis,
    getStudentDetails,
    getDepartmentFaculty,
    exportWinnersCsv
};
