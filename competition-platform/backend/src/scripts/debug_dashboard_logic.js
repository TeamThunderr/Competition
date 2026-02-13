const supabase = require('../config/supabaseClient');

async function debugDashboard() {
    console.log('--- DEBUG DASHBOARD STATS ---');
    try {
        // 1. Setup Context (Mimic Faculty User)
        const deptId = (await supabase.from('departments').select('id').eq('name', 'CSE').single()).data.id;
        const assignedSections = ['CSE-A']; // Based on screenshot

        console.log(`Dept ID: ${deptId}, Sections: ${assignedSections}`);

        // 2. Mimic getMyStudentIds logic
        let allStudents = [];
        const { data: pageData } = await supabase
            .from('users')
            .select('id, section, full_name, registration_no')
            .eq('role', 'STUDENT')
            .eq('department_id', deptId);

        if (pageData) allStudents = pageData;

        // Filtering
        const allowedSections = new Set();
        assignedSections.forEach(s => {
            if (!s) return;
            allowedSections.add(s.trim().toUpperCase());
            const parts = s.split('-');
            if (parts.length > 1) allowedSections.add(parts[parts.length - 1].trim().toUpperCase());
        });

        console.log('Allowed Sections:', Array.from(allowedSections));

        const myStudents = allStudents.filter(student => {
            const studentSec = (student.section || '').trim().toUpperCase();
            return allowedSections.has(studentSec);
        });

        console.log(`Found ${myStudents.length} students in sections.`);
        const myStudentIds = myStudents.map(s => s.id);

        if (myStudentIds.length === 0) {
            console.log('No students found!');
            return;
        }

        // Check if Balaji is in the list
        const balaji = myStudents.find(s => s.registration_no === '24CS0002');
        console.log('Is Balaji in list?', !!balaji);

        // 3. Stats Calculation (Robust Logic copy-paste)

        // Fetch Registrations
        const { data: regStatsData } = await supabase
            .from('registrations')
            .select('user_id, status, won_status')
            .in('user_id', myStudentIds);

        // Fetch Status
        const { data: statusData } = await supabase
            .from('competition_status')
            .select('user_id, is_shortlisted, is_winner')
            .in('user_id', myStudentIds);

        const uniqueWinnerStudents = new Set();

        statusData.forEach(s => {
            if (s.is_winner) uniqueWinnerStudents.add(s.user_id);
        });

        regStatsData.forEach(r => {
            if (r.status === 'Winner' || r.won_status === 'WON') {
                uniqueWinnerStudents.add(r.user_id);
                console.log(`Found Winner via Registration: ${r.user_id}`);
            }
        });

        console.log(`Winners Count: ${uniqueWinnerStudents.size}`);

    } catch (err) {
        console.error('Error:', err);
    }
}

debugDashboard();
