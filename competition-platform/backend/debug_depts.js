const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Current directory:', process.cwd());
console.log('Env keys:', Object.keys(process.env).filter(k => k.startsWith('SUPABASE')));

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartments() {
    const { data, error } = await supabase
        .from('competitions')
        .select('title, departments');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Competitions Data:');
        data.forEach(c => {
            console.log(`Title: ${c.title}`);
            console.log(`Departments:`, c.departments, `(Type: ${typeof c.departments})`);
            console.log('---');
        });
    }
}

checkDepartments();
