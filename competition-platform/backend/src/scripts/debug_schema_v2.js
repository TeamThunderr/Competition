const supabase = require('../config/supabaseClient');

async function checkColumn(column) {
    console.log(`Checking column: ${column}...`);
    const { data, error } = await supabase
        .from('registrations')
        .select(column)
        .limit(1);

    if (error) {
        console.error(`❌ Error on ${column}:`, error.message);
    } else {
        console.log(`✅ ${column} exists.`);
    }
}

async function run() {
    await checkColumn('gmail_message_id');
    await checkColumn('confidence_score');
    await checkColumn('proof_url');
    await checkColumn('source');
    await checkColumn('verified');
}

run();
