const supabase = require('./src/config/supabaseClient');

const searchSmith = async () => {
    console.log("Searching for 'smith'...");

    // Search in email OR full_name
    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .or(`email.ilike.%smith%,full_name.ilike.%smith%`);

    if (error) {
        console.error("Search Error:", error);
        return;
    }

    if (users.length === 0) {
        console.log("No user found matching 'smith'.");
        console.log("Listing ALL users to be sure:");
        const { data: allUsers } = await supabase.from('users').select('id, email, full_name').limit(20);
        allUsers.forEach(u => console.log(`- ${u.email} (${u.full_name})`));
    } else {
        console.log(`Found ${users.length} match(es):`);
        users.forEach(u => {
            console.log(`[MATCH] ${u.full_name} | ${u.email} | ${u.id}`);
        });
    }
};

searchSmith();
