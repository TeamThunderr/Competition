const supabase = require('./src/config/supabaseClient');

async function check() {
    const { data: od } = await supabase.from('od_requests').select('status').limit(10);
    console.log('OD Statuses:', od);

    const { data: team } = await supabase.from('teams').select('verification_status').limit(10);
    console.log('Team Statuses:', team);
    process.exit(0);
}

check();
