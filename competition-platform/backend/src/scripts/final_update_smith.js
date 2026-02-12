const supabase = require('../config/supabaseClient');

const run = async () => {
    // 1. Find User
    const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', '%smith%');

    if (!users || users.length === 0) {
        console.log("No user found.");
        return;
    }

    const targetUser = users[0];
    console.log(`Updating for User: ${targetUser.email} (${targetUser.id})`);

    const compId = '2380ea19-1490-4498-9d83-d2cd3963286f';

    // 2. Update Status
    const { data, error } = await supabase
        .from('registrations')
        .update({ status: 'Qualified' })
        .eq('user_id', targetUser.id)
        .eq('competition_id', compId)
        .select();

    if (error) {
        console.error("Update Failed:", error);
    } else {
        console.log("SUCCESS! Updated Status to 'Qualified'. Row:", data);
    }
};

run();
