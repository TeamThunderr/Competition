
require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

async function checkTables() {
    console.log('--- Checking Tables ---');

    const tables = ['registrations', 'competition_status', 'departments', 'users'];

    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error(`[ERROR] Table '${table}':`, error.message);
            } else {
                console.log(`[OK] Table '${table}' exists. Count: ${count}`);
            }
        } catch (err) {
            console.error(`[EXCEPTION] Table '${table}':`, err.message);
        }
    }
}

checkTables();
