const supabase = require('../config/supabaseClient');

async function testExportQuery() {
    try {
        console.log('Testing Export Query...');

        // 1. Mock student IDs (we need to find some valid student IDs first)
        const { data: students, error: studentError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'STUDENT')
            .limit(5);

        if (studentError) {
            console.error('Error fetching students:', studentError);
            return;
        }

        const studentIds = students.map(s => s.id);
        console.log('Using Student IDs:', studentIds);

        // 2. Run the exact query from the controller
        const { data: reportData, error } = await supabase
            .from('registrations')
            .select(`
                registered_at, verified, status,
                users!registrations_user_id_fkey ( full_name, registration_no, section, email, phone_number ),
                competitions!inner ( title, organizer, competition_date, type )
            `)
            .in('user_id', studentIds)
            .limit(5);

        if (error) {
            console.error('QUERY FAILED:', error);
        } else {
            console.log('QUERY SUCCESS!');
            console.log('Data sample:', reportData[0]);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testExportQuery();
