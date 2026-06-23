const supabase = require('../config/supabaseClient');
require('dotenv').config({ path: '../../.env' }); // Adjust path if running from src/scripts

const debugData = async () => {
    console.log('--- DEBUGGING SYNC DATA ---');

    // 1. Check Date
    const now = new Date().toISOString();
    console.log('Current Server Time:', now);

    // 2. Fetch Active Competitions
    const { data: competitions, error: compError } = await supabase
        .from('competitions')
        .select('*')
        .gte('registration_deadline', now);

    if (compError) console.error('Error fetching comps:', compError.message);
    else {
        console.log(`Found ${competitions.length} active competitions (deadline >= now).`);
        competitions.forEach(c => console.log(` - ${c.title} (Deadline: ${c.registration_deadline})`));
    }

    // 3. Fetch ALL Competitions to see if any exist
    if (competitions && competitions.length === 0) {
        console.log('--- Checking ALL Competitions ---');
        const { data: allComps } = await supabase.from('competitions').select('title, registration_deadline');
        allComps.forEach(c => console.log(` - ${c.title} (Deadline: ${c.registration_deadline}) -> Active? ${c.registration_deadline >= now}`));
    }
};

debugData();
