const supabase = require('../config/supabaseClient');

async function checkExtensions() {
    console.log('--- ALL EXTENSION OD REQUESTS ---');
    const { data: ods, error } = await supabase
        .from('od_requests')
        .select('id, user_id, status, is_extension, extension_count, parent_od_id, from_date, to_date, created_at')
        .eq('is_extension', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(JSON.stringify(ods, null, 2));
    }
    process.exit(0);
}

checkExtensions();
