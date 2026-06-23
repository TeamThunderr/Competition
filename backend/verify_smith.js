const supabase = require('./src/config/supabaseClient');

const verifySmith = async () => {
    const { data: users } = await supabase.from('users').select('id, email').ilike('email', '%smith%');
    if (!users || users.length === 0) return console.log("User not found.");

    const userId = users[0].id;
    const compId = '2380ea19-1490-4498-9d83-d2cd3963286f';

    const { data } = await supabase
        .from('registrations')
        .select('status')
        .eq('user_id', userId)
        .eq('competition_id', compId);

    console.log(`User: ${users[0].email} | Status:`, data);
};
verifySmith();
