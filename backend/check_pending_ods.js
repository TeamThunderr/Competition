const supabase = require('./src/config/supabaseClient');

async function checkPendingODs() {
    console.log('--- RECENT PENDING OD REQUESTS ---');
    const { data: ods, error } = await supabase
        .from('od_requests')
        .select('id, user_id, status, is_extension, extension_count, parent_od_id, from_date, to_date, created_at')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(JSON.stringify(ods, null, 2));
    }
    process.exit(0);
}

checkPendingODs();
