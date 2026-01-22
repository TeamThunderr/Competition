
require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

const checkCompetitions = async () => {
    console.log('Fetching competitions...');
    const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No competitions found.');
    } else {
        console.log(`Found ${data.length} competitions.`);
        data.forEach((comp, index) => {
            console.log(`\n--- Competition ${index + 1} ---`);
            console.log(`Title: ${comp.title}`);
            console.log(`Departments Type: ${typeof comp.departments}`);
            console.log(`Departments Value:`, comp.departments);
            if (Array.isArray(comp.departments)) {
                console.log('Is Array: Yes');
            } else {
                console.log('Is Array: No');
            }
        });
    }
};

checkCompetitions();
