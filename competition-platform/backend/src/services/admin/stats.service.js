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
    const userIds = [...new Set(registrations.map(r => r.student_id))];

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
        const user = userMap[reg.student_id];

        if (!user) {
            console.warn(`[StatsService] Orphaned Registration: ${reg.id}`);
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
                sections: {}
            };
        }

        stats[deptId].total_registrations++;

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
            competition_id: reg.competition_id
        });
    });

    const result = Object.values(stats).map(dept => ({
        ...dept,
        sections: Object.values(dept.sections)
    }));

    console.log('[StatsService] Aggregated Result:', JSON.stringify(result, null, 2));
    return result;
};

module.exports = {
    getDepartmentStats
};
