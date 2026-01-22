const supabase = require('./src/config/supabaseClient');

async function debugAdvisorLookup() {
    console.log("--- Debugging Advisor Lookup ---");

    // 1. Fetch a few students
    const { data: students, error: sError } = await supabase
        .from('users')
        .select('id, full_name, section, departments(name)')
        .eq('role', 'STUDENT')
        .limit(3);

    if (sError) {
        console.error("Error fetching students:", sError);
        return;
    }

    console.log(`Found ${students.length} students.`);

    // 2. Fetch all faculty
    const { data: faculty, error: fError } = await supabase
        .from('users')
        .select('id, full_name, assigned_sections, departments(name)')
        .eq('role', 'FACULTY');

    if (fError) {
        console.error("Error fetching faculty:", fError);
        return;
    }

    console.log(`Found ${faculty.length} faculty.`);

    // 3. Try to match manually and log formats
    console.log("\n--- COMPARISON ---");
    students.forEach(s => {
        // Construct what the faculty section likely looks like
        const deptPrefix = s.departments?.name || ''; // e.g., CSE
        const likelyFacultyValue = `${deptPrefix}-${s.section}`; // e.g., CSE-A

        console.log(`Student Section: "${s.section}"`);
        console.log(`Hypothesis: Faculty might have "${likelyFacultyValue}"`);
    });

    console.log("\nFACULTY SAMPLE:");
    faculty.slice(0, 5).forEach(f => {
        console.log(`FACULTY: Name=${f.full_name} AssignedSections=${JSON.stringify(f.assigned_sections)}`);
    });
}

debugAdvisorLookup();
