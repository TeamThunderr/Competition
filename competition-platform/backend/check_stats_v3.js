
const statsService = require('./src/services/admin/stats.service');
const supabase = require('./src/config/supabaseClient');
require('dotenv').config();
const fs = require('fs');

async function check() {
    try {
        const output = {
            test_results: []
        };

        // 1. Fetch DB Departments
        const { data: depts } = await supabase.from('departments').select('*');
        const dbDeptNames = depts.map(d => d.name).sort();
        output.db_departments = dbDeptNames;

        // 2. Fetch Service Output
        console.log("Fetching stats...");
        const result = await statsService.getDepartmentStats();

        output.service_entries = result.map(r => ({
            name: r.department_name,
            registrations: r.total_registrations,
            students: r.total_students
        }));

        // CHECK 1: Are 0-registration departments HIDDEN?
        const zeroReg = result.filter(r => r.total_registrations === 0);
        output.test_results.push({
            test: "0-Registration Departments Hidden",
            passed: zeroReg.length === 0,
            violations: zeroReg.map(d => d.department_name)
        });

        fs.writeFileSync('stats_final_verify.json', JSON.stringify(output, null, 2));
        console.log("Verification complete.");

    } catch (e) {
        console.error(e);
        fs.writeFileSync('stats_final_error.json', JSON.stringify({ error: e.message }));
    }
}

check();
