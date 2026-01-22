
const supabase = require('./src/config/supabaseClient');
require('dotenv').config();

async function checkRoles() {
    try {
        const { data: users, error } = await supabase.from('users').select('role').limit(10);
        if (users && users.length > 0) {
            console.log("Sample Roles:", users.map(u => u.role));
        } else {
            console.log("No users found or error:", error);
        }
    } catch (e) {
        console.error(e);
    }
}
checkRoles();
