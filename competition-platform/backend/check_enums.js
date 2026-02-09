const supabase = require('./src/config/supabaseClient');

async function checkEnums() {
    console.log('Fetching enum values...');

    // Query to get all enum types and their values
    const query = `
        SELECT t.typname as enum_name, e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        ORDER BY t.typname, e.enumsortorder;
    `;

    const { data, error } = await supabase.rpc('get_enums');

    if (error) {
        console.error('RPC Error:', error);
        // Fallback: try to query od_requests directly to see what works
        console.log('Trying to probe od_requests status enum...');
        const { data: test, error: testError } = await supabase
            .from('od_requests')
            .select('status')
            .limit(1);
        if (testError) console.error('Probe Error:', testError);
        else console.log('Sample Status:', test);
    } else {
        console.log('Enum Values:', data);
    }
    process.exit(0);
}

checkEnums();
