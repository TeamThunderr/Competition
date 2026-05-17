const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'e:/CIT/Competition/competition-platform/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkCounts() {
    console.log('--- Debugging Counts ---');

    // 1. Get the 2 students
    const { data: students } = await supabase.from('users').select('id, full_name').eq('role', 'STUDENT').limit(5);
    const studentIds = students.map(s => s.id);
    console.log('Students:', students.map(s => s.full_name));

    // 2. Count Registrations (Manual)
    const { data: regs } = await supabase
        .from('registrations')
        .select('competition_id, user_id')
        .in('user_id', studentIds);

    console.log(`\nManual Registrations (${regs.length}):`);
    regs.forEach(r => console.log(`- Comp ${r.competition_id} | User ${r.user_id}`));

    // 3. Count Participation (Auto)
    const { data: parts } = await supabase
        .from('participation')
        .select('competition_id, student_id, status')
        .in('student_id', studentIds);

    console.log(`\nAuto Participation (${parts.length}):`);
    parts.forEach(p => console.log(`- Comp ${p.competition_id} | User ${p.student_id} | ${p.status}`));

    // 4. Calculate Unique Union
    const combined = new Set();
    regs.forEach(r => combined.add(`${r.competition_id}-${r.user_id}`));
    parts.forEach(p => combined.add(`${p.competition_id}-${p.student_id}`));

    console.log(`\nTotal Unique Participations: ${combined.size}`);
}

checkCounts();
