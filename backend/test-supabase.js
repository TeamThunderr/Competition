require('./src/config/env');
const supabase = require('./src/config/supabaseClient');

async function test() {
    console.log('Fetching a faculty user...');
    const { data: facultyUsers, error: fError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'FACULTY')
        .limit(1);

    if (fError) {
        console.error('Faculty error:', fError);
    } else if (facultyUsers.length > 0) {
        console.log('Faculty keys:', Object.keys(facultyUsers[0]));
        console.log('Faculty section:', facultyUsers[0].section);
        console.log('Faculty assigned_sections:', facultyUsers[0].assigned_sections);
    } else {
        console.log('No faculty found.');
    }

    console.log('\nFetching a student user...');
    const { data: studentUsers, error: sError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'STUDENT')
        .limit(1);

    if (sError) {
        console.error('Student error:', sError);
    } else if (studentUsers.length > 0) {
        console.log('Student keys:', Object.keys(studentUsers[0]));
        console.log('Student section:', studentUsers[0].section);
        console.log('Student assigned_sections:', studentUsers[0].assigned_sections);
    } else {
        console.log('No student found.');
    }
}

test();
