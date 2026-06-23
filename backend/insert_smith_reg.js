const supabase = require('./src/config/supabaseClient');

const insertReg = async () => {
    // 1. Get User ID for smithc
    const { data: users } = await supabase.from('users').select('id, email').ilike('email', '%smith%');
    if (!users || users.length === 0) return console.log("User not found.");

    const user = users[0];
    const compId = '2380ea19-1490-4498-9d83-d2cd3963286f';

    console.log(`Inserting registration for: ${user.email}`);

    // 2. Insert Registration
    const { data, error } = await supabase
        .from('registrations')
        .insert([{
            user_id: user.id,
            competition_id: compId,
            status: 'Qualified',
            source: 'MANUAL_FIX',
            registered_at: new Date()
        }])
        .select();

    if (error) console.error("Insert Failed:", error);
    else console.log("Success! Created:", data);
};

insertReg();
