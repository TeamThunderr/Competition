const supabase = require('../../config/supabaseClient');

const getDepartmentStats = async () => {
    console.log('[StatsService] Fetching department stats (Enhanced Analysis Mode)...');

    // 1. Fetch ALL registrations
    const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*');

    if (regError) {
        console.error('[StatsService] Reg Fetch Error:', regError);
        throw new Error(regError.message);
    }

    // 2. Fetch ALL Departments
    const { data: allDepartments, error: deptError } = await supabase
        .from('departments')
        .select('id, name');

    const deptMap = {};
    if (!deptError && allDepartments) {
        allDepartments.forEach(d => { deptMap[d.id] = d.name; });
    }

    // 3. Fetch ALL Users (to calculate total strength per dept)
    // Use pagination to bypass 1000 row limit
    let allUsers = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, department_id, full_name, email, section, role')
            .range(from, from + step - 1);

        if (userError) throw new Error(userError.message);
        if (!users || users.length === 0) break;

        allUsers = [...allUsers, ...users];
        from += step;
        if (users.length < step) break; // End of list
    }

    // Filter only students for accurate strength calculation
    const studentUsers = allUsers.filter(u => u.role === 'STUDENT');

    // 4. Competition Status fetch removed - using registrations as source of truth

    // --- AGGREGATION ---

    // A. Calculate Total Strength per Department
    const deptStrength = {};
    const userMap = {}; // Helper for lookups

    // Map ALL users to be safe for foreign key lookups
    allUsers.forEach(u => {
        userMap[u.id] = u;
    });

    // Only count 'students' for the strength metric
    studentUsers.forEach(u => {
        const dId = u.department_id || 'unknown';
        if (!deptStrength[dId]) deptStrength[dId] = 0;
        deptStrength[dId]++;
    });

    // B. Map Registrations to Departments
    const stats = {};

    // Initialize stats for all known departments (even if 0 registrations)
    if (allDepartments) {
        allDepartments.forEach(d => {
            stats[d.id] = {
                department_id: d.id,
                department_name: d.name,
                total_students: deptStrength[d.id] || 0,
                unique_participants: new Set(),
                total_registrations: 0,
                verified_registrations: 0,
                unique_winners: new Set(),     // Changed from counter to Set
                unique_shortlisted: new Set(), // Changed from counter to Set
                sections: {}
            };
        });
    }



    // Process Registrations (Only Verified)
    registrations.forEach(reg => {
        const user = userMap[reg.user_id];
        if (!user) return; // Skip if user not found (e.g. deleted user)

        const deptId = user.department_id || 'unknown';

        // Filter: Only include Verified Registrations for "Active" stats
        // User Feedback: "during verification pending... it is updating" -> Don't count pending.
        if (!reg.verified) return;

        // Safety check if dept wasn't in list
        if (!stats[deptId]) {
            stats[deptId] = {
                department_id: deptId,
                department_name: deptMap[deptId] || (deptId === 'unknown' ? 'Unknown Department' : `Unknown (${deptId})`),
                total_students: deptStrength[deptId] || 0,
                unique_participants: new Set(),
                total_registrations: 0,
                verified_registrations: 0,
                unique_winners: new Set(),
                unique_shortlisted: new Set(),
                sections: {}
            };
        }

        const s = stats[deptId];
        s.total_registrations++; // Now effectively "Active/Verified Registrations"
        s.unique_participants.add(user.id);
        s.verified_registrations++; // Kept for consistency, though now same as total

        // Count Winners
        if (reg.status === 'Winner') {
            s.unique_winners.add(user.id);
        }

        // Count Qualified
        if ((reg.status === 'Qualified' || reg.status === 'SHORTLISTED') && reg.qualification_verified) {
            s.unique_shortlisted.add(user.id);
        }

        // Section breakdown
        const section = user.section || 'N/A';
        if (!s.sections[section]) {
            s.sections[section] = { name: section, count: 0 };
        }
        s.sections[section].count++;
        // Student details removed to prevent drill-down and reduce payload size

    });

    // Process Winners/Shortlisted block removed - handled in registrations loop

    // Final Calculations & Format
    const result = Object.values(stats).map(dept => {
        const uniqueCount = dept.unique_participants.size;
        const winnerCount = dept.unique_winners.size;

        // Participation Rate: Active Students / Total Students
        let participationRate = 0;
        if (dept.total_students > 0) {
            participationRate = (uniqueCount / dept.total_students) * 100;
        }

        // Success Rate: Winners / Unique Participants
        let successRate = 0;
        if (uniqueCount > 0) {
            successRate = (winnerCount / uniqueCount) * 100;
        }

        return {
            ...dept,
            unique_participants: uniqueCount, // Convert Set to number
            winners: winnerCount,             // Convert Set to number
            shortlisted: dept.unique_shortlisted.size, // Convert Set to number
            participation_rate: parseFloat(participationRate.toFixed(1)),
            success_rate: parseFloat(successRate.toFixed(1)),
            sections: Object.values(dept.sections)
        };
    });

    // Filter: Only show departments that have at least one registration
    const activeDepartments = result.filter(dept => dept.total_registrations > 0);

    return activeDepartments.sort((a, b) => b.participation_rate - a.participation_rate);
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

    // 2. Fetch Status (Shortlisted/Winners) - Removed
    // const { data: statuses ... }

    // 3. User IDs involved
    const regUserIds = registrations.map(r => r.user_id);
    const uniqueUserIds = [...new Set(regUserIds)];

    console.log(`[StatsService] Unique User IDs: ${uniqueUserIds.length}`);

    if (uniqueUserIds.length === 0) {
        return { overall: { total: 0, shortlisted: 0, winners: 0 }, departments: [] };
    }

    // 4. Fetch Users & Departments
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
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

            if (reg.status === 'Qualified' || reg.status === 'SHORTLISTED') {
                if (reg.qualification_verified) {
                    s.shortlisted++;
                    overall.shortlisted++;
                }
            }
            if (reg.status === 'Winner') {
                s.winners++;
                overall.winners++;
            }
        }
    });

    // Count Status (Shortlisted/Winners) logic removed - integrated above

    // 6. Detailed Participants List
    const participants = registrations.map(reg => {
        const user = userMap[reg.user_id];
        if (!user) return null;

        const deptName = user.department_id ? (deptMap[user.department_id] || 'Unknown') : 'Unknown';

        // Calculate Batch (Graduation Year)
        let batch = 'Unknown';
        if (user.admission_year) {
            batch = (user.admission_year + 4).toString();
        } else if (user.registration_no) {
            const regNo = user.registration_no;
            const prefix = regNo.substring(0, 2);
            const yearSuffix = parseInt(prefix, 10);
            if (!isNaN(yearSuffix) && yearSuffix > 10 && yearSuffix < 99) {
                batch = (2000 + yearSuffix + 4).toString();
            }
        }

        // Find status from registration
        let statusLabel = 'Registered';
        if (reg.status === 'Winner') statusLabel = 'Winner';
        else if ((reg.status === 'Qualified' || reg.status === 'SHORTLISTED') && reg.qualification_verified) statusLabel = 'Shortlisted';

        return {
            id: user.id,
            full_name: user.full_name || 'Unknown User',
            registration_no: user.registration_no || 'N/A',
            email: user.email || 'N/A',
            department: deptName,
            section: user.section || 'N/A',
            batch: batch,
            status: statusLabel,
            verified: reg.verified
        };
    }).filter(p => p !== null);

    // 7. Meta Data for Dropdowns (Master Lists)
    // Departments are already fetched in #4
    const allDepartments = departments ? departments.map(d => d.name).sort() : [];

    // Calculate academic years (Batches) - Last 4 years + next year
    const currentYear = new Date().getFullYear();
    const batches = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

    const result = {
        overall,
        departments: Object.values(stats),
        participants,
        meta: {
            departments: allDepartments,
            batches: batches,
            sections: ['A', 'B', 'C', 'D'] // Standard sections as they aren't in a separate table usually
        }
    };

    console.log('[StatsService] Stats aggregation complete');
    return result;
};

module.exports = {
    getDepartmentStats,
    getCompetitionStats
};
