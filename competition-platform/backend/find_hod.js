require('dotenv').config({ path: './backend/.env' });
const supabase = require('./src/config/supabaseClient');

async function findHodUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('email, role, name')
        .ilike('role', '%nod%') // Search for 'hod', 'HOD', 'Head of Department'
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found HOD Users:", data);
    }
}

async function findHardcodedHod() {
    // Specific check for 'HOD' role
    const { data, error } = await supabase
        .from('users')
        .select('email, role, name')
        .eq('role', 'HOD')
        .limit(5);

    if (data && data.length > 0) {
        console.log("Strict 'HOD' Users:", data);
    } else {
        console.log("No users with strict 'HOD' role found.");
        // Check what roles DO exist
        const { data: roles } = await supabase.from('users').select('role');
        const uniqueRoles = [...new Set(roles.map(r => r.role))];
        console.log("Available Roles:", uniqueRoles);
    }
}

findHodUsers().then(() => findHardcodedHod());
