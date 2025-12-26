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

        sendResponse(res, 200, stats, 'Fetched department stats');
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
