const supabase = require('./src/config/supabaseClient');

async function checkStatuses() {
    console.log('Fetching unique OD statuses...');
    const { data, error } = await supabase
        .from('od_requests')
        .select('status');

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    const statuses = [...new Set(data.map(d => d.status))];
    console.log('Existing statuses in od_requests table:', statuses);
    process.exit(0);
}

checkStatuses();
