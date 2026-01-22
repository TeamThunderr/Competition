const supabase = require('./src/config/supabaseClient');

async function debugFacultySections() {
    console.log("--- Debugging Faculty Sections ---");

    // Fetch all FACULTY
    const { data: faculty, error } = await supabase
        .from('users')
        .select('full_name, assigned_sections, department_id, departments(name)')
        .eq('role', 'FACULTY');

    if (error) { console.error(error); return; }

    console.log(`Found ${faculty.length} Faculty members.`);
    faculty.forEach(f => {
        console.log(`Faculty: ${f.full_name} | Dept: ${f.departments?.name} | Sections: ${JSON.stringify(f.assigned_sections)}`);
    });

    console.log("\n--- Checking Student 1 ---");
    const { data: student } = await supabase
        .from('users')
        .select('full_name, section, departments(name)')
        .ilike('full_name', '%Student 1%')
        .single();

    if (student) {
        console.log(`Student: ${student.full_name} | Dept: ${student.departments?.name} | Section: '${student.section}'`);
        const searchTag1 = `${student.departments?.name}-${student.section}`; // e.g. CSE-A
        const searchTag2 = student.section; // e.g. A

        console.log(`Searching for tag: '${searchTag1}' OR '${searchTag2}'`);
    } else {
        console.log("Student 1 not found.");
    }
}

debugFacultySections();
