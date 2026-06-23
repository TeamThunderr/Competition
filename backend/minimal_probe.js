const supabase = require('./src/config/supabaseClient');

async function probe() {
    console.log('Probing OD:');
    const { data: od } = await supabase.from('od_requests').select('status').limit(1);
    console.log(od);

    console.log('Probing Team:');
    const { data: team } = await supabase.from('teams').select('verification_status').limit(1);
    console.log(team);
    process.exit(0);
}

probe();
