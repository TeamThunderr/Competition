
require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

async function checkReg() {
    console.log('--- CHECKING registrations ---');
    const { data, error, count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.log('ERROR:', error.message);
    } else {
        console.log('SUCCESS. Count:', count);
    }
}
checkReg();
