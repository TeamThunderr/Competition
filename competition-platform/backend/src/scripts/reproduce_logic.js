const supabase = require('../config/supabaseClient');

async function reproduce() {
    console.log('--- REPRODUCE LOGIC V2 ---');
    try {
        const regNo = '24CS0002';
        const { data: student } = await supabase.from('users').select('id, full_name').eq('registration_no', regNo).single();
        const { data: comp } = await supabase.from('competitions').select('id').ilike('title', '%Gamejam%').single();

        const competitionId = comp.id;
        const userId = student.id;

        console.log(`Checking duplicates for User: ${userId} in Comp: ${competitionId}`);

        // Fetch All Registrations for this user/comp
        const { data: registrations } = await supabase
            .from('registrations')
            .select('*')
            .eq('competition_id', competitionId)
            .eq('user_id', userId);

        console.log(`Found ${registrations.length} registrations.`);
        registrations.forEach((r, i) => {
            console.log(`[${i}] ID: ${r.id}, Status: '${r.status}', WonStatus: '${r.won_status}', Verified: ${r.verified}`);
        });

        const regMap = new Map(registrations?.map(r => [r.user_id, r]) || []);
        const rFromMap = regMap.get(userId);
        console.log(`Map Value Status: '${rFromMap?.status}'`);


    } catch (err) {
        console.error('Error:', err);
    }
}

reproduce();
