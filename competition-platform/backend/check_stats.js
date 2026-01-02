
const supabase = require('./src/config/supabaseClient');
require('dotenv').config();
const statsService = require('./src/services/admin/stats.service');
const fs = require('fs');

async function check() {
    try {
        const output = {};

        // Check Departments Table
        const { data: depts, error } = await supabase.from('departments').select('*');
        output.db_departments = depts ? depts.map(d => d.name) : [];
        output.db_count = depts ? depts.length : 0;

        console.log("Calling service...");
        const result = await statsService.getDepartmentStats();
        output.service_count = result.length;
        output.service_data = result.map(r => ({
            name: r.department_name,
            students: r.total_students,
            registrations: r.total_registrations,
            sections_count: r.sections ? r.sections.length : 0,
            has_student_details: r.sections && r.sections.length > 0 ? !!r.sections[0].students : false
        }));

        fs.writeFileSync('stats_result.json', JSON.stringify(output, null, 2));
        console.log("Done. Wrote to stats_result.json");
        process.exit(0);

    } catch (e) {
        console.error(e);
        fs.writeFileSync('stats_error.txt', e.toString());
        process.exit(1);
    }
}

check();
