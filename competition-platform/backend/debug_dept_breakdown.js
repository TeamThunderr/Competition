const supabase = require('./src/config/supabaseClient');
const fs = require('fs');

async function debugDeptBreakdown() {
    console.log("--- Department Shortlist Audit (Paginated) ---");

    // 1. Fetch Users (With Pagination)
    let allUsers = [];
    let from = 0;
    const step = 1000;

    while (true) {
        console.log(`Fetching users from ${from} to ${from + step - 1}...`);
        const { data: users, error } = await supabase
            .from('users')
            .select('id, full_name, department_id, role')
            .range(from, from + step - 1);

        if (error) { console.error(error); break; }
        if (!users || users.length === 0) break;

        allUsers = [...allUsers, ...users];
        from += step;
        if (users.length < step) break; // Reached end
    }

    console.log(`Total Users Fetched: ${allUsers.length}`);

    const userMap = {};
    allUsers.forEach(u => userMap[u.id] = u);

    // 2. Fetch Departments
    const { data: depts } = await supabase.from('departments').select('id, name');
    const deptMap = {};
    depts.forEach(d => deptMap[d.id] = d.name);

    // 3. Fetch Status
    const { data: statuses } = await supabase.from('competition_status').select('*');

    const breakdown = {}; // deptId -> { name, shortlistedCount, students: [] }

    statuses.forEach(st => {
        // Count if Shortlisted or Winner
        if (!st.is_shortlisted && !st.is_winner) return;

        const user = userMap[st.user_id];
        if (!user) {
            console.log(`WARNING: Shortlisted/Winner entry for unknown user ${st.user_id}`);
            return;
        }

        const deptId = user.department_id || 'unknown';
        const deptName = deptMap[deptId] || 'Unknown Dept';

        if (!breakdown[deptId]) {
            breakdown[deptId] = { name: deptName, count: 0, students: [] };
        }

        breakdown[deptId].count++; // This counts instances. Use Set for unique users if needed?
        // Actually dept perf counts unique. My debug script counts instances.
        // I should count unique users here too to match backend logic.
    });

    // Re-calculate unique breakdown
    const uniqueBreakdown = {};
    statuses.forEach(st => {
        // Count if Shortlisted or Winner
        if (!st.is_shortlisted && !st.is_winner) return;

        const user = userMap[st.user_id];
        if (!user) return;
        const deptId = user.department_id || 'unknown';

        if (!uniqueBreakdown[deptId]) {
            uniqueBreakdown[deptId] = {
                name: deptMap[deptId] || 'Unknown',
                uniqueUsers: new Set(),
                details: []
            };
        }

        if (!uniqueBreakdown[deptId].uniqueUsers.has(st.user_id)) {
            uniqueBreakdown[deptId].uniqueUsers.add(st.user_id);
            uniqueBreakdown[deptId].details.push({
                name: user.full_name,
                role: user.role,
                status: st.is_winner ? 'Winner' : 'Shortlisted'
            });
        }
    });

    let output = "\n--- SHORTLIST REPORT (UNIQUE) ---\n";
    Object.keys(uniqueBreakdown).forEach(id => {
        const d = uniqueBreakdown[id];
        output += `DEPT: ${d.name} | Total Unique: ${d.uniqueUsers.size}\n`;
        d.details.forEach(s => {
            output += `  > ${s.name} | Role: ${s.role} | Status: ${s.status}\n`;
        });
    });

    fs.writeFileSync('debug_output.txt', output);
    console.log("Report written to debug_output.txt");
}

debugDeptBreakdown();
