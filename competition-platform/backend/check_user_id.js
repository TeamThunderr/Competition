const supabase = require('./src/config/supabaseClient');

async function checkUser() {
    const userId = '0f664e97-a595-4ba1-9ac4-bdfde76a17f2';
    console.log(`Checking User ID: ${userId}`);

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) { console.error(error); process.exit(1); }
    if (user) {
        console.log('User found:', user);

        const { data: ods } = await supabase
            .from('od_requests')
            .select('*')
            .eq('user_id', userId);

        console.log(`Found ${ods.length} OD records.`);
        ods.forEach(od => console.log(`  - ${od.status} | ${od.from_date} to ${od.to_date} | is_ext: ${od.is_extension}`));
    } else {
        console.log('User not found.');
    }
    process.exit(0);
}

checkUser();
