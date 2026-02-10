const supabase = require('./src/config/supabaseClient');

async function checkOD() {
    console.log('--- GLOBAL DIAGNOSTIC ---');

    const { data: users, error: userError } = await supabase.from('users').select('id, full_name');
    if (userError) { console.error(userError); process.exit(1); }

    const { data: ods, error: odError } = await supabase.from('od_requests').select('*').order('created_at', { ascending: false });
    if (odError) { console.error(odError); process.exit(1); }

    console.log(`Analyzing ${ods.length} records...`);

    ods.forEach((od, i) => {
        const user = users.find(u => u.id === od.user_id);
        console.log(`\n[${i}] ${user ? user.full_name : 'Unknown'} | Status: ${od.status}`);
        console.log(`    ID: ${od.id}`);
        console.log(`    Dates: ${od.from_date} to ${od.to_date}`);
        console.log(`    Is Extension: ${od.is_extension} | Count: ${od.extension_count}`);
        console.log(`    Parent: ${od.parent_od_id}`);
        console.log(`    Reason: ${od.reason.substring(0, 50)}`);
    });

    process.exit(0);
}

checkOD();
