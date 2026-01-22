require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

async function findAdmin() {
    console.log("--- Searching for Admin Users ---");

    // 1. Search by Role (case insensitive)
    const { data: byRole, error: roleError } = await supabase
        .from('users')
        .select('email, role, full_name')
        .ilike('role', '%admin%');

    if (byRole && byRole.length > 0) {
        console.log("Found by Role:", byRole);
    } else {
        console.log("No users found with role showing 'admin'.");
    }

    // 2. Search by Email (case insensitive)
    const { data: byEmail, error: emailError } = await supabase
        .from('users')
        .select('email, role, full_name')
        .ilike('email', '%admin%');

    if (byEmail && byEmail.length > 0) {
        console.log("Found by Email:", byEmail);
    } else {
        console.log("No users found with email containing 'admin'.");
    }
}

findAdmin();
