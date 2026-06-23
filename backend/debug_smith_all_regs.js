const supabase = require('./src/config/supabaseClient');

const checkRegs = async () => {
    // 1. Find User
    const { data: users } = await supabase.from('users').select('id, email').ilike('email', '%smith%');
    if (!users || users.length === 0) return console.log("User not found.");

    const user = users[0];
    console.log(`Checking registrations for: ${user.email} (${user.id})`);

    // 2. Get Allocations
    const { data: regs, error } = await supabase
        .from('registrations')
        .select('competition_id, status, source')
        .eq('user_id', user.id);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (regs.length === 0) {
        console.log("No registrations found for any competition.");
    } else {
        console.log("Found Registrations:");
        regs.forEach(r => console.log(`- Comp ID: ${r.competition_id} | Status: ${r.status}`));
    }
};

checkRegs();
