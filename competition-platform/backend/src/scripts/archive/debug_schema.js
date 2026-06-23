const supabase = require('../config/supabaseClient');

async function inspectSchema() {
    try {
        console.log('Fetching one competition...');
        const { data, error } = await supabase
            .from('competitions')
            .select('*') // Select all to see keys
            .limit(1);

        if (error) {
            console.error('Error fetching competition:', error);
            return;
        }

        if (data && data.length > 0) {
            const keys = Object.keys(data[0]);
            console.log('Available Columns:', keys);

            const targetCols = ['organizer', 'type', 'competition_date', 'date', 'event_date', 'registration_deadline'];
            console.log('\n--- Column Verification ---');
            targetCols.forEach(col => {
                console.log(`${col}: ${keys.includes(col) ? 'EXISTS' : 'MISSING'}`);
            });
        } else {
            console.log('No competitions found.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

inspectSchema();
