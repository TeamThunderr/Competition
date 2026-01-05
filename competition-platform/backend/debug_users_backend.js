const supabase = require('./src/config/supabaseClient');

async function listUsers() {
    console.log("Fetching users...");
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error("Error fetching users:", error);
    } else {
        console.log(`Found ${data.length} users:`);
        console.table(data.map(u => ({ id: u.id, email: u.email, role: u.role })));
    }
}

listUsers();
