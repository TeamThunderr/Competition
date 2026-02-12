const supabase = require('../config/supabaseClient');

async function checkSchema() {
    console.log('Checking od_requests schema...');

    const { data, error } = await supabase.rpc('get_table_info', { table_name_input: 'od_requests' });

    if (error) {
        // Fallback: Use a direct query to information_schema if RPC fails
        console.log('RPC failed, trying direct query...');
        const { data: cols, error: colError } = await supabase
            .from('od_requests')
            .select('*')
            .limit(1);

        if (colError) {
            console.error('Error:', colError);
        } else if (cols.length > 0) {
            console.log('Existing columns in a record:', Object.keys(cols[0]));
        } else {
            console.log('No records found to check columns.');
        }
    } else {
        console.log('Table Info:', data);
    }
    process.exit(0);
}

checkSchema();
