const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: 'e:/CIT/Competition/competition-platform/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function format(rows, label) {
    if (!rows || rows.length === 0) return `[${label}] No Records found.`;
    return `[${label}] Records:\n` + rows.map(r => JSON.stringify(r)).join('\n');
}

async function audit() {
    console.log('--- DATA AUDIT ---');

    // 1. Get Departments & Sections & Students
    // Assumption: We are looking for CSE-A students.
    // First, find 'CSE' dept, then find students in 'A'.

    // Just fetch ALL students to be safe and filter in JS
    const { data: students } = await supabase.from('users').select('id, full_name, section, email').eq('role', 'STUDENT');

    const cseStudents = students.filter(s => s.section === 'A' || s.section === 'CSE-A'); // Adjust filter as needed
    const cseIds = new Set(cseStudents.map(s => s.id));

    console.log(`\nFound ${cseStudents.length} Students in 'A' Section:`, cseStudents.map(s => s.full_name));

    // 2. Competitions
    const { data: comps } = await supabase.from('competitions').select('id, title');
    const compMap = new Map(comps.map(c => [c.id, c.title]));
    console.log(`\nCompetitions:`, comps.map(c => c.title));

    // 3. Participation (Auto)
    const { data: participation } = await supabase.from('participation').select('*');

    // 4. Registrations (Manual)
    const { data: registrations } = await supabase.from('registrations').select('*');

    console.log('\n--- ANALYSIS ---');

    // A. Dashboard Metric (Should only count 'A' students in 'participation')
    // Note: My recent fix changed this to include BOTH? No wait, getDashboardStats currently looks at 'participation' only? 
    // Wait, let me verify the CODE logic in standard language.
    // Original Code: select count from participation where student_id in (cseIds)

    const metricCount = participation.filter(p => cseIds.has(p.student_id)).length;
    console.log(`Expected Dashboard Metric (Participation Only): ${metricCount}`);

    // B. Dashboard Cards (Public/All)
    // Code: registrations(count) + participation(count)

    comps.forEach(comp => {
        const manual = registrations.filter(r => r.competition_id === comp.id).length;
        const auto = participation.filter(p => p.competition_id === comp.id).length;
        console.log(`Card '${comp.title}': Manual=${manual} + Auto=${auto} = Total ${manual + auto}`);
    });

}

audit();
