const supabase = require('./backend/src/config/supabaseClient');

async function checkDepts() {
    console.log('Checking departments...');
    const { data, error } = await supabase.from('departments').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Departments found:', data.length);
        console.table(data);
    }
}

checkDepts();
