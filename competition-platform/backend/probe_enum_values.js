const supabase = require('./src/config/supabaseClient');

async function probeEnum() {
    const testStatuses = ['VERIFIED', 'APPROVED', 'PENDING'];

    // Find a real ID to test with (but don't actually change it if possible, or change it back)
    const { data: od } = await supabase.from('od_requests').select('id, status').limit(1).single();
    if (!od) {
        console.log('No OD found to test with.');
        process.exit(0);
    }

    const originalStatus = od.status;
    console.log(`Original Status of OD ${od.id}: ${originalStatus}`);

    for (const status of testStatuses) {
        console.log(`Testing status: ${status}...`);
        const { error } = await supabase.from('od_requests').update({ status }).eq('id', od.id);
        if (error) {
            console.log(`FAILED for ${status}: ${error.message}`);
        } else {
            console.log(`SUCCESS for ${status}`);
        }
    }

    // Restore original
    await supabase.from('od_requests').update({ status: originalStatus }).eq('id', od.id);
    process.exit(0);
}

probeEnum();
