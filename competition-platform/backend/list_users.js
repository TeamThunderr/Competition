const supabase = require('./src/config/supabaseClient');

async function listUsers() {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) { console.error(error); process.exit(1); }
    console.log(`Total users: ${users.length}`);
    users.forEach(u => console.log(`- ${u.full_name} | ${u.registration_no} | ${u.id}`));
    process.exit(0);
}

listUsers();
