const supabase = require('./src/config/supabaseClient');

async function checkOD() {
    console.log('--- USER LIST ---');
    const { data: users, error: userError } = await supabase.from('users').select('id, full_name');
    if (userError) { console.error(userError); process.exit(1); }

    users.forEach(u => console.log(`- ${u.full_name} (${u.id})`));

    console.log('\n--- FINDING SMITH ---');
    const smith = users.find(u => u.full_name?.toLowerCase().includes('smith'));
    if (smith) {
        console.log(`Matching User: ${smith.full_name} (${smith.id})`);
        const { data: ods } = await supabase.from('od_requests').select('*').eq('user_id', smith.id);
        console.log(`Found ${ods.length} records:`);
        ods.forEach(od => console.log(`  - [${od.status}] ${od.from_date} to ${od.to_date} | is_ext: ${od.is_extension} | reason: ${od.reason.substring(0, 30)}`));
    } else {
        console.log('No user found containing "smith"');
    }
    process.exit(0);
}

checkOD();
