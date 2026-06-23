const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'e:/CIT/Competition/competition-platform/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function cleanup() {
    console.log('--- CLEANING GHOST RECORDS ---');

    // Delete records with status 'NOT_REGISTERED'
    const { data, error, count } = await supabase
        .from('participation')
        .delete({ count: 'exact' })
        .eq('status', 'NOT_REGISTERED');

    if (error) {
        console.error('Error deleting:', error.message);
    } else {
        console.log(`Successfully deleted ${count} ghost records.`);
    }
}

cleanup();
