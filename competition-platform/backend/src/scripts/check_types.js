const supabase = require('../config/supabaseClient');

async function checkTypes() {
    console.log('Probing column types...');

    // We can use a trick: try to update with a bad value and see the error message which often contains the type
    // Or we can try to query information_schema if we have permissions (but rpc is usually better)

    // Let's try to find an existing record and see what its type looks like via JSON stringify
    const { data: od } = await supabase.from('od_requests').select('status').limit(1);
    console.log('OD status sample:', od);

    const { data: team } = await supabase.from('teams').select('verification_status').limit(1);
    console.log('Team status sample:', team);

    process.exit(0);
}

checkTypes();
