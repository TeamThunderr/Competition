
require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

async function debugTrace() {
    console.log('--- STARTING TRACE ---');
    try {
        // 1. Registrations
        console.log('Fetching registrations...');
        const { data: registrations, error: regError } = await supabase.from('registrations').select('*').limit(10);
        if (regError) throw regError;
        console.log(`Registrations count (limit 10): ${registrations.length}`);
        if (registrations.length > 0) console.log('Sample Reg:', registrations[0]);

        // 2. Users
        console.log('Fetching users...');
        const { data: users, error: userError } = await supabase.from('users').select('id, department_id, role');
        if (userError) throw userError;
        console.log(`Users count: ${users.length}`);

        // 3. Departments
        console.log('Fetching departments...');
        const { data: depts, error: deptError } = await supabase.from('departments').select('id, name');
        if (deptError) throw deptError;
        console.log(`Departments count: ${depts.length}`);

        // 4. Map check
        if (registrations.length > 0) {
            const sampleReg = registrations[0];
            const user = users.find(u => u.id === sampleReg.user_id);
            console.log(`Checking match for user_id ${sampleReg.user_id}:`, user ? 'FOUND' : 'NOT FOUND');
            if (user) {
                console.log('User Dept ID:', user.department_id);
                const dept = depts.find(d => d.id === user.department_id);
                console.log('Dept found:', dept ? dept.name : 'NO MATCH');
            }
        }

    } catch (err) {
        console.error('--- TRACE ERROR ---');
        console.error(err);
    }
    console.log('--- IND TRACE ---');
}

debugTrace();
