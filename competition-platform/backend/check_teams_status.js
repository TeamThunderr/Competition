const supabase = require('./src/config/supabaseClient');

async function checkTeamsStatuses() {
    const { data, error } = await supabase
        .from('teams')
        .select('verification_status')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Last 5 Team Statuses:', data.map(d => d.verification_status));
    }
    process.exit(0);
}

checkTeamsStatuses();
