require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

async function debugUsers() {
    console.log("Fetching a Faculty...");
    const { data: faculty, error: fError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'FACULTY')
        .limit(1);

    if (fError) console.error(fError);
    else console.log("Faculty Result:", JSON.stringify(faculty, null, 2));

    console.log("\nFetching a Student...");
    const { data: student, error: sError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'STUDENT')
        .limit(1);

    if (sError) console.error(sError);
    else console.log("Student Result:", JSON.stringify(student, null, 2));
}

debugUsers();
