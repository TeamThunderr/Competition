const supabase = require('../config/supabaseClient');

const checkSmith = async () => {
    const email = 'smithc.cse@citchennai.net';
    console.log(`Checking for User: ${email}`);

    // 1. List All Users to Find Match
    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email');

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    console.log(`Found ${users.length} users.`);
    users.forEach(u => {
        if (u.email.includes('smith')) {
            console.log(`MATCH: ${u.full_name} | ${u.email} | ${u.id}`);
        }
    });

    // console.log(`Found User: ${user.full_name} (${user.id})`); // REMOVED to prevent crash

    // 2. Get Registrations
    const { data: regs, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id);

    if (regError) {
        console.error("Error fetching registrations:", regError);
        return;
    }

    if (regs.length === 0) {
        console.log("No registrations found for this user.");
    } else {
        console.log(`Found ${regs.length} registrations:`);
        regs.forEach(r => {
            console.log(`- Comp: ${r.competition_id} | Status: "${r.status}" | Source: ${r.source}`);
        });
    }
};

checkSmith();
