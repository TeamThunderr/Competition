
const supabase = require('../config/supabaseClient');

async function debugRegistrations() {
    try {
        console.log("Checking registrations table...");

        // 1. Get all registrations (limit 10)
        const { data: regs, error } = await supabase.from('registrations').select('*').limit(20);

        if (error) {
            console.error("Error fetching registrations:", error);
            return;
        }

        console.log(`Found ${regs.length} total registrations.`);
        console.log(regs);

        // 2. Check for specific users involved in the logs if known managed manually or by pattern
        // The logs mentioned 'smithc.cse2024@citchennai.net' and 'balajiv.cse2024@citchennai.net' in previous turns (implied by "Found 2 matching students")
        // Let's try to find their IDs first.

        const { data: users } = await supabase.from('users').select('id, email').ilike('email', '%@citchennai.net%');

        for (const user of users) {
            const { count } = await supabase.from('registrations').select('*', { count: 'exact' }).eq('user_id', user.id);
            console.log(`User ${user.email} (ID: ${user.id}) has ${count} registrations.`);
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

debugRegistrations();
