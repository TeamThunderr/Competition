const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'e:/CIT/Competition/competition-platform/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function inspect() {
    console.log('--- INSPECTING TN-IMPACT ---');

    // 1. Find Competition ID for TN-IMPACT or similar
    const { data: comps } = await supabase.from('competitions').select('id, title').ilike('title', '%IMPACT%');

    if (comps.length === 0) {
        console.log('No TN-IMPACT competition found.');
        return;
    }
    const compId = comps[0].id;
    console.log(`Competition Found: ${comps[0].title} (${compId})`);

    // 2. Get Participation
    const { data: parts } = await supabase
        .from('participation')
        .select('*')
        .eq('competition_id', compId);

    console.log(`\nParticipation Records (${parts.length}):`);
    parts.forEach(p => {
        console.log(`- User: ${p.student_id} | Status: "${p.status}"`);
    });
}

inspect();
