
const supabase = require('./src/config/supabaseClient');
const dotenv = require('dotenv');
dotenv.config();

async function checkCompetitions() {
    try {
        const { data, count, error } = await supabase
            .from('competitions')
            .select('*', { count: 'exact', head: false });

        if (error) {
            console.error('Error fetching competitions:', error);
            return;
        }

        console.log(`Total Competitions: ${count}`);
        if (data.length > 0) {
            console.log('First competition sample:', data[0]);
        } else {
            console.log('No competitions found in the table.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkCompetitions();
