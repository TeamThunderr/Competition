const supabase = require('./src/config/supabaseClient');

async function debugDeptStats() {
    console.log("--- Debugging Dept Stats ---");

    // 1. Fetch all competition_status
    const { data: statuses, error } = await supabase
        .from('competition_status')
        .select('*');

    if (error) { console.error(error); return; }

    console.log(`Total Status Rows: ${statuses.length}`);

    // Count shortlisted manually
    let shortlistedCount = 0;
    const shortlistedUsers = new Set();
    const shortlistedLog = [];

    for (const s of statuses) {
        if (s.is_shortlisted) {
            shortlistedCount++;
            shortlistedUsers.add(s.user_id);
            // Fetch name for context
            const { data: u } = await supabase.from('users').select('full_name, department_id').eq('id', s.user_id).single();
            shortlistedLog.push({
                user: u?.full_name || s.user_id,
                dept: u?.department_id,
                compId: s.competition_id
            });
        }
    }

    console.log(`Manual Count of Shortlisted Rows: ${shortlistedCount}`);
    console.log(`Unique Shortlisted Users: ${shortlistedUsers.size}`);
    console.table(shortlistedLog);

    console.log("\n--- CROSS REFERENCE ---");
    const { data: regs } = await supabase.from('registrations').select('user_id');
    const regUserIds = new Set(regs.map(r => r.user_id));

    statuses.forEach(s => {
        const hasReg = regUserIds.has(s.user_id);
        console.log(`User ${s.user_id} | Shortlisted: ${s.is_shortlisted} | Has Registration: ${hasReg}`);
    });
}

debugDeptStats();
