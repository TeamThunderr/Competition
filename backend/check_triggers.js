const supabase = require('./src/config/supabaseClient');

async function checkTriggers() {
    console.log('Checking for triggers on od_requests...');

    // We can't query pg_trigger directly without RPC, but we can try 
    // to see if some weird behavior happens on insert/update.

    // I'll try to find any RPC that might be related to triggers or schema
    const { data: functions, error } = await supabase.rpc('get_functions');
    if (error) {
        console.log('Cannot list functions. Probing via update behavior...');
    } else {
        console.log('Functions:', functions);
    }
    process.exit(0);
}

checkTriggers();
