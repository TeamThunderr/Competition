
require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

async function check() {
    console.log('--- CHECKING competition_status ---');
    const { data, error, count } = await supabase
        .from('competition_status')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.log('ERROR:', error.message);
    } else {
        console.log('SUCCESS. Count:', count);
    }
}
check();
