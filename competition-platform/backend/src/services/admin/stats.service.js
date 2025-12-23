const supabase = require('../../config/supabaseClient');

const getDepartmentStats = async () => {
    console.log('[StatsService] Fetching department stats (Manual Join Mode)...');

    // 1. Fetch ALL registrations
    const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*');

    if (regError) {
        console.error('[StatsService] Reg Fetch Error:', regError);
        throw new Error(regError.message);
    }

    if (registrations.length === 0) {
        return [];
    }

    // 2. Fetch ALL Departments for Mapping
    // We do this to ensure we can map department_id to a name even if the FK on users is missing/broken.
    const { data: allDepartments, error: deptError } = await supabase
        .from('departments')
        .select('id, name');

    const deptMap = {};
    if (!deptError && allDepartments) {
        allDepartments.forEach(d => { deptMap[d.id] = d.name; });
    } else {
        console.warn('[StatsService] Failed to fetch departments:', deptError);
    }

    // 3. Extract User IDs
    const userIds = [...new Set(registrations.map(r => r.user_id))];

    // 4. Fetch Users (Plain)
    // Select * to ensure we don't miss fields due to casing or schema changes
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

    if (userError) {
        console.error('[StatsService] User Fetch Error:', userError);
        throw new Error(userError.message);
    }

    // Map Users for easy lookup
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    // 5. Aggregate Data
    const stats = {};

    registrations.forEach(reg => {
        const user = userMap[reg.user_id];

        if (!user) {
            console.warn(`[StatsService] Orphaned Registration: ${reg.id} (User ID: ${reg.user_id})`);
            return;
        }

        const deptId = user.department_id || 'unknown';
        // Use the manual deptMap first, fallback to 'Unknown'
        const deptName = deptMap[deptId] || `Unknown Department (${deptId})`;
        const section = user.section || 'N/A';

        if (!stats[deptId]) {
            stats[deptId] = {
                department_id: deptId,
                department_name: deptName,
                total_registrations: 0,
                verified_registrations: 0,
                sections: {}
            };
        }

        stats[deptId].total_registrations++;
        if (reg.verified) {
            stats[deptId].verified_registrations++;
        }

        if (!stats[deptId].sections[section]) {
            stats[deptId].sections[section] = {
                name: section,
                count: 0,
                students: []
            };
        }

        stats[deptId].sections[section].count++;
        stats[deptId].sections[section].students.push({
            student_id: user.id,
            full_name: user.full_name,
            email: user.email,
            competition_id: reg.competition_id,
            verified: reg.verified || false
        });
    });

    const result = Object.values(stats).map(dept => ({
        ...dept,
        sections: Object.values(dept.sections)
    }));

    console.log('[StatsService] Aggregated Result:', JSON.stringify(result, null, 2));
    return result;
};

const getCompetitionStats = async (competitionId) => {
    console.log(`[StatsService] Fetching stats for competition: ${competitionId}`);

    // 1. Fetch Registrations
    const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('competition_id', competitionId);

    if (regError) {
        console.error('[StatsService] Error fetching registrations:', regError);
        throw regError;
    }
    console.log(`[StatsService] Found ${registrations.length} registrations`);

    // 2. Fetch Status (Shortlisted/Winners)
    const { data: statuses, error: statusError } = await supabase
        .from('competition_status')
        .select('*')
        .eq('competition_id', competitionId);

    if (statusError) {
        console.error('[StatsService] Error fetching statuses:', statusError);
        throw statusError;
    }
    console.log(`[StatsService] Found ${statuses.length} status entries`);

    // 3. User IDs involved
    const regUserIds = registrations.map(r => r.user_id);
    const statusUserIds = statuses.map(s => s.user_id);
    const uniqueUserIds = [...new Set([...regUserIds, ...statusUserIds])];

    console.log(`[StatsService] Unique User IDs: ${uniqueUserIds.length}`);

    if (uniqueUserIds.length === 0) {
        return { overall: { total: 0, shortlisted: 0, winners: 0 }, departments: [] };
    }

    // 4. Fetch Users & Departments
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, department_id')
        .in('id', uniqueUserIds);

    if (userError) {
        console.error('[StatsService] Error fetching users:', userError);
        throw userError;
    }
    console.log(`[StatsService] Fetched ${users.length} users details`);

    const { data: departments, error: deptError } = await supabase.from('departments').select('id, name');
    if (deptError) console.error('[StatsService] Error fetching departments:', deptError);

    const deptMap = {};
    if (departments) departments.forEach(d => deptMap[d.id] = d.name);

    // 5. Aggregate
    const stats = {};
    const overall = { total: 0, shortlisted: 0, winners: 0 };

    // Helper to get dept entry
    const getDeptStat = (deptId) => {
        if (!stats[deptId]) {
            stats[deptId] = {
                name: deptMap[deptId] || `Unknown (${deptId})`,
                registrations: 0,
                shortlisted: 0,
                winners: 0
            };
        }
        return stats[deptId];
    };

    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    // Count Registrations
    registrations.forEach(reg => {
        const user = userMap[reg.user_id];
        if (user) {
            const deptId = user.department_id || 'unknown';
            const s = getDeptStat(deptId);
            s.registrations++;
            overall.total++;
        }
    });

    // Count Status (Shortlisted/Winners)
    statuses.forEach(st => {
        const user = userMap[st.user_id];
        if (user) {
            const deptId = user.department_id || 'unknown';
            const s = getDeptStat(deptId);

            if (st.is_shortlisted) {
                s.shortlisted++;
                overall.shortlisted++;
            }
            if (st.is_winner) {
                s.winners++;
                overall.winners++;
            }
        }
    });

    const result = {
        overall,
        departments: Object.values(stats)
    };

    console.log('[StatsService] Stats aggregation complete');
    return result;
};

module.exports = {
    getDepartmentStats,
    getCompetitionStats
};
