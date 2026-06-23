
const supabase = require('./src/config/supabaseClient');
require('dotenv').config();

async function debugData() {
    try {
        console.log("--- DATA DEBUG ---");

        // 1. Check Registrations
        const { data: regs, error: rErr } = await supabase.from('registrations').select('*');
        if (rErr) throw rErr;
        console.log(`Total Registrations in DB: ${regs.length}`);

        if (regs.length > 0) {
            console.log("Sample Registration:", regs[0]);

            // Check the User for this registration
            const sampleUserId = regs[0].user_id;
            const { data: user, error: uErr } = await supabase.from('users').select('*').eq('id', sampleUserId).single();

            if (uErr) {
                console.log(`Error fetching user ${sampleUserId}:`, uErr.message);
            } else if (!user) {
                console.log(`User ${sampleUserId} NOT FOUND in users table!`);
            } else {
                console.log(`User found: Name=${user.full_name}, Role=${user.role}, DeptID=${user.department_id}`);
                if (user.role !== 'student') {
                    console.log("!!! WARNING: User is NOT a student. Stats service filters out non-students!");
                }
            }
        }

        // 2. Check CSE Department Users
        const { data: cse } = await supabase.from('departments').select('*').eq('name', 'CSE').single();
        if (cse) {
            const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('department_id', cse.id);
            console.log(`CSE Department (ID: ${cse.id}) has ${count} users.`);
        } else {
            console.log("CSE Department not found in DB.");
        }

        console.log("--- END DEBUG ---");

    } catch (e) {
        console.error("DEBUG ERROR:", e);
    }
}

debugData();
