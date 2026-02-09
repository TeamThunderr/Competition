const supabase = require('./src/config/supabaseClient');

async function checkAllTriggers() {
    console.log('Fetching all triggers from information_schema...');

    // We try to use information_schema.triggers
    // If we don't have direct access, we try to use a common RPC if it exists
    const sql = `
        SELECT 
            trigger_name, 
            event_object_table as table_name, 
            action_statement, 
            action_timing
        FROM information_schema.triggers;
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error('Error fetching triggers:', error);
    } else {
        console.log('Triggers:', JSON.stringify(data, null, 2));
    }
    process.exit(0);
}

checkAllTriggers();
