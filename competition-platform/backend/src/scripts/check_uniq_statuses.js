const supabase = require('../config/supabaseClient');

async function checkUniqueStatuses() {
    console.log('--- OD REQUEST STATUSES ---');
    const { data: odData, error: odErr } = await supabase.from('od_requests').select('status');
    if (odErr) console.error('OD Error:', odErr);
    else {
        const statuses = [...new Set(odData.map(d => d.status))];
        console.log('Statuses:', statuses);
    }

    console.log('\n--- TEAM VERIFICATION STATUSES ---');
    const { data: teamData, error: teamErr } = await supabase.from('teams').select('verification_status');
    if (teamErr) console.error('Team Error:', teamErr);
    else {
        const statuses = [...new Set(teamData.map(d => d.verification_status))];
        console.log('Statuses:', statuses);
    }
    process.exit(0);
}

checkUniqueStatuses();
