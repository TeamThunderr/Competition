// File Name: hod.controller.js
// Purpose: Handle HOD requests
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');
const supabase = require('../../config/supabaseClient');
const statsService = require('../../services/admin/stats.service');

const getDepartmentStats = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;
        console.log(`[HodController] Fetching stats for Dept: ${hodDeptId}`);

        // 1. Fetch ALL Student IDs in this Dept (Central source of truth)
        const { data: deptStudentsRaw, error: userError } = await supabase
            .from('users')
            .select('id, section')
            .eq('role', 'STUDENT')
            .eq('department_id', hodDeptId);

        if (userError) throw userError;

        const deptStudents = deptStudentsRaw || [];
        const studentCount = deptStudents.length;
        const studentIds = deptStudents.map(u => u.id);

        // Calculate Unique Sections
        const uniqueSections = [...new Set(deptStudents.map(u => u.section).filter(Boolean))].length;

        // 2. Active Competitions (Standard check)
        const now = new Date().toISOString();
        const { count: activeCompCount, error: compError } = await supabase
            .from('competitions')
            .select('id', { count: 'exact', head: true })
            .gt('registration_deadline', now);

        if (compError) throw compError;

        // 3. Shortlisted Students (Filter by Student IDs)
        let shortlistedCount = 0;
        if (studentIds.length > 0) {
            const { count, error: shortError } = await supabase
                .from('competition_status')
                .select('id', { count: 'exact', head: true })
                .eq('is_shortlisted', true)
                .in('user_id', studentIds);

            if (shortError) throw shortError;
            shortlistedCount = count || 0;
        }

        // 4. Pending OD Requests (Filter by Student IDs)
        let odCount = 0;
        if (studentIds.length > 0) {
            const { count, error: odError } = await supabase
                .from('od_requests')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'PENDING')
                .in('user_id', studentIds);

            if (odError) throw odError;
            odCount = count || 0;
        }

        const stats = [
            { label: 'TOTAL DEPT. STUDENTS', value: studentCount.toString(), subtext: `Across ${uniqueSections} Sections`, borderLeft: 'border-l-4 border-blue-500' },
            { label: 'ACTIVE COMPETITIONS', value: (activeCompCount || 0).toString(), subtext: 'Ongoing this semester', borderLeft: '' },
            { label: 'SHORTLISTED STUDENTS', value: shortlistedCount.toString(), subtext: 'Qualified Round 1', borderLeft: '' },
            { label: 'PENDING OD REQUESTS', value: odCount.toString(), subtext: 'Requires Immediate Action', borderLeft: '' },
        ];

        // ... (previous stats calculation kept) ...

        // 6. Detailed Section Analytics (Replacing Mock Data)
        // We need: Section Name | Total Students | Registered count | Qualified count | Pending OD count

        // Fetch all students in dept with their registration/status/OD info
        // This is a bit heavy, so we might want to optimize later, but for < 1000 students it's fine.
        const { data: analyticsUsers, error: analyticsError } = await supabase
            .from('users')
            .select(`
                id, section, role,
                registrations ( id, verified ),
                competition_status ( is_shortlisted, is_winner ),
                od_requests ( status )
            `)
            .eq('department_id', hodDeptId)
            .eq('role', 'STUDENT');

        if (analyticsError) throw analyticsError;

        // Process Analytics
        const sectionMap = {};

        analyticsUsers.forEach(u => {
            const sec = u.section || 'Unassigned';
            if (!sectionMap[sec]) {
                sectionMap[sec] = {
                    section: sec,
                    batch: '2024-28', // TODO: Derive from year/reg_no if available
                    totalStudents: 0,
                    registered: 0,
                    qualified: 0,
                    pending: 0
                };
            }

            const s = sectionMap[sec];
            s.totalStudents++;

            // Registered: Has at least one registration
            if (u.registrations && u.registrations.length > 0) s.registered++;

            // Qualified: Has at least one shortlisted status
            if (u.competition_status && u.competition_status.some(cs => cs.is_shortlisted || cs.is_winner)) s.qualified++;

            // Pending OD: Has pending requests
            if (u.od_requests && u.od_requests.some(od => od.status === 'PENDING')) s.pending++;
        });

        const sectionAnalytics = Object.values(sectionMap).sort((a, b) => a.section.localeCompare(b.section));

        sendResponse(res, 200, {
            cards: stats,
            sections: sectionAnalytics
        }, 'Fetched department stats and analytics');
    } catch (err) {
        console.error('[HodController] Error:', err);
        // Send the actual error message to help debug (though in prod we hide it)
        sendResponse(res, 500, null, `Internal Server Error: ${err.message}`);
    }
};

const getDepartmentUsers = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;

        // Fetch all users (Students & Faculty) in the same department
        // PAGINATION LOGIC
        let allUsers = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error: pageError } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    role,
                    section,
                    registration_no,
                    assigned_sections,
                    departments!inner (
                        name
                    )
                `)
                .eq('department_id', hodDeptId)
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

        const users = allUsers;

        sendResponse(res, 200, users, 'Fetched department users');
    } catch (err) {
        console.error('[HodController] Error fetching department users:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

module.exports = { getDepartmentStats, getDepartmentUsers };
