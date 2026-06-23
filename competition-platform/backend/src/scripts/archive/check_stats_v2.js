
const statsService = require('./src/services/admin/stats.service');
const supabase = require('./src/config/supabaseClient');
require('dotenv').config();

async function check() {
    try {
        console.log("Checking stats service output...");
        const result = await statsService.getDepartmentStats();

        console.log(`Total Entries: ${result.length}`);

        result.forEach(r => {
            console.log(`[${r.department_name}] (ID: ${r.department_id})`);
            console.log(`   - Students: ${r.total_students}`);
            console.log(`   - Registrations: ${r.total_registrations}`);
            console.log(`   - Shortlisted: ${r.shortlisted}`);
            console.log(`   - Winners: ${r.winners}`);
            console.log(`   - Participation Rate: ${r.participation_rate}%`);
            // Check for recursive structures or large payloads
            const sectionKeys = r.sections ? r.sections.map(s => s.name) : [];
            console.log(`   - Sections: ${sectionKeys.join(', ')}`);
            if (r.sections && r.sections.some(s => s.students)) {
                console.error("   !!! ERROR: Student details still present !!!");
            }
        });

        // specific check for Unknown
        const unknown = result.find(r => r.department_id === 'unknown');
        if (unknown) {
            console.log("Unknown Department is PRESENT.");
            if (unknown.total_registrations === 0) {
                console.log("   -> And it has 0 registrations. This contradicts 'Only if contributed'.");
            }
        } else {
            console.log("Unknown Department is NOT present (Correct if 0 registrations).");
        }

    } catch (e) {
        console.error(e);
    }
}

check();
