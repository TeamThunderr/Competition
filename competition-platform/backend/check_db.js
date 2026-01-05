
const supabase = require('./src/config/supabaseClient');
require('dotenv').config();

async function check() {
    try {
        const { count, error } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true });

        if (error) console.error(error);
        console.log(`Total Registrations: ${count}`);

        const { count: deptCount, error: deptError } = await supabase
            .from('departments')
            .select('*', { count: 'exact', head: true });
        console.log(`Total Departments: ${deptCount}`);

    } catch (e) {
        console.error(e);
    }
}

check();
