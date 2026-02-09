const supabase = require('./src/config/supabaseClient');

async function checkEnumUsage() {
    console.log('Checking enum usage for status_type...');

    const query = `
        SELECT 
            table_name, 
            column_name, 
            udt_name
        FROM 
            information_schema.columns 
        WHERE 
            udt_name = 'status_type';
    `;

    // Since I can't run raw SQL easily without RPC, let's try to infer from data
    console.log('Probing od_requests status column type...');
    const { data: odData, error: odErr } = await supabase.from('od_requests').select('status').limit(1);
    console.log('OD status sample:', odData);

    console.log('Probing teams verification_status column type...');
    const { data: teamData, error: teamErr } = await supabase.from('teams').select('verification_status').limit(1);
    console.log('Team status sample:', teamData);

    process.exit(0);
}

checkEnumUsage();
