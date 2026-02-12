const supabase = require('../config/supabaseClient');

const listUsers = async () => {
    console.log("Listing users...");
    const { data: users, error } = await supabase.from('users').select('id, email, full_name');

    if (error) return console.error(error);

    console.log(`Total Users: ${users.length}`);
    users.forEach(u => console.log(`[USER] ${u.email} | ${u.full_name} | ${u.id}`));
};

listUsers();
