const supabase = require('./src/config/supabaseClient');

const fixSmith = async () => {
    // 1. Get User ID
    const { data: users } = await supabase.from('users').select('id, email').ilike('email', '%smith%');
    if (!users || users.length === 0) return console.log("User not found.");

    const user = users[0];
    const actualCompId = 'ee8a45d3-df85-4a86-b0c7-f7bd2556277b'; // The one found in debug

    console.log(`Updating for: ${user.email} | Comp: ${actualCompId}`);

    // 2. Update Status
    const { data, error } = await supabase
        .from('registrations')
        .update({ status: 'Qualified' })
        .eq('user_id', user.id)
        .eq('competition_id', actualCompId)
        .select();

    if (error) console.error("Update match failed:", error);
    else console.log("SUCCESS! Updated Row:", data);
};

fixSmith();
