const supabase = require('./src/config/supabaseClient');

const updateStatus = async () => {
    const email = 'smithc.cse@citchennai.net';
    const competitionId = '2380ea19-1490-4498-9d83-d2cd3963286f'; // Confirmed from debugging

    console.log(`Updating status for: ${email}`);

    // 1. Get User ID
    const { data: user, error: uErr } = await supabase.from('users').select('id').eq('email', email).single();

    if (uErr || !user) {
        console.error("User not found!", uErr);
        // Fallback: search by name
        const { data: users } = await supabase.from('users').select('id, email').textSearch('email', 'smith');
        if (users && users.length > 0) {
            console.log("Did you mean one of these?", users);
        }
        return;
    }

    console.log(`User ID: ${user.id}`);

    // 2. Update Registration
    const { data, error } = await supabase
        .from('registrations')
        .update({ status: 'Qualified' })
        .eq('user_id', user.id)
        .eq('competition_id', competitionId)
        .select();

    if (error) console.error("Update Failed:", error);
    else console.log("Success! Updated Row:", data);
};

updateStatus();
