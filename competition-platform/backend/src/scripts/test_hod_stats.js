const supabase = require('../config/supabaseClient');

async function testHodStats() {
    console.log('Starting HOD Stats Test...');

    try {
        // 1. Get an HOD user to test with
        const { data: hods, error: hodError } = await supabase
            .from('users')
            .select('id, department_id, full_name')
            .eq('role', 'HOD')
            .limit(1);

        if (hodError || !hods || hods.length === 0) {
            console.error('Could not find HOD user:', hodError);
            return;
        }

        const hod = hods[0];
        const hodDeptId = hod.department_id;
        console.log(`Testing with HOD: ${hod.full_name}, Dept ID: ${hodDeptId}`);

        // Step 1: Fetch Students
        console.log('--- Step 1: Fetch Students ---');
        const { data: students, error: sError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'STUDENT')
            .eq('department_id', hodDeptId)
            .limit(10);

        if (sError) console.error('Step 1 Failed:', sError);
        else console.log(`Step 1 Success. Found ${students.length} students.`);

        // Step 2: Active Competitions
        console.log('--- Step 2: Active Competitions ---');
        const now = new Date().toISOString();
        const { count: activeCompCount, error: cError } = await supabase
            .from('competitions')
            .select('id', { count: 'exact', head: true })
            .gt('registration_deadline', now);

        if (cError) console.error('Step 2 Failed:', cError);
        else console.log(`Step 2 Success. Count: ${activeCompCount}`);

        // Step 3: Shortlisted
        console.log('--- Step 3: Shortlisted ---');
        const { count: shortCount, error: shError } = await supabase
            .from('competition_status')
            .select('users!inner(department_id)', { count: 'exact', head: true })
            .eq('is_shortlisted', true)
            .eq('users.department_id', hodDeptId);

        if (shError) {
            console.error('Step 3 Failed:', shError);
            // Try troubleshooting: List relationships? No easy way.
            // Try simpler query
            console.log('Retrying Step 3 with simpler query...');
            const { error: retryError } = await supabase.from('competition_status').select('id').limit(1);
            if (retryError) console.error('Simple Select Failed:', retryError);
            else console.log('Simple select worked. Issue is likely the join.');
        }
        else console.log(`Step 3 Success. Count: ${shortCount}`);

        // Step 4: Pending OD
        console.log('--- Step 4: Pending OD ---');
        const { count: odCount, error: odError } = await supabase
            .from('od_requests')
            .select('users!user_id!inner(department_id)', { count: 'exact', head: true })
            .eq('status', 'PENDING')
            .eq('users.department_id', hodDeptId);

        if (odError) console.error('Step 4 Failed:', odError);
        else console.log(`Step 4 Success. Count: ${odCount}`);


        // Step 6: Detailed Analytics (Complex Join)
        console.log('--- Step 6: Complex Join ---');
        const { data: analyticsUsers, error: aError } = await supabase
            .from('users')
            .select(`
                id, section, role, admission_year,
                registrations:registrations!user_id ( id, verified ),
                competition_status ( is_shortlisted, is_winner ),
                od_requests:od_requests!user_id ( status )
            `)
            .eq('department_id', hodDeptId)
            .eq('role', 'STUDENT')
            .limit(10);

        if (aError) {
            console.error('Step 6 Failed:', aError);
            console.error('Full Error:', JSON.stringify(aError, null, 2));
        }
        else console.log(`Step 6 Success. Fetched ${analyticsUsers.length} users with joins.`);



        console.log('Script Finished');

        // Step 7: Faculty Fetch
        console.log('--- Step 7: Faculty Fetch ---');
        const { data: facultyData, error: fError } = await supabase
            .from('users')
            .select('full_name, assigned_sections')
            .eq('role', 'FACULTY')
            .eq('department_id', hodDeptId);

        if (fError) console.error('Faculty Fetch Failed:', fError);
        else console.log(`Faculty Fetch Success. Found ${facultyData ? facultyData.length : 0} faculty.`);

        // Step 8: Processing Loop
        console.log('--- Step 8: Processing Loop ---');
        const sectionMap = {};
        const currentYear = new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear();

        if (analyticsUsers) {
            analyticsUsers.forEach(u => {
                try {
                    const sec = u.section || 'Unassigned';
                    // Determine Academic Year
                    const diff = u.admission_year ? currentYear - u.admission_year : -1;
                    const academicYearLabel = diff === 1 ? '2nd Year' : diff === 2 ? '3rd Year' : diff === 3 ? '4th Year' : 'Other';
                    const mapKey = `${sec}-${academicYearLabel}`;

                    if (!sectionMap[mapKey]) {
                        // Find Faculty Advisor Logic
                        let facultyNames = [];
                        if (facultyData) {
                            const advisors = facultyData.filter(f => {
                                const sections = f.assigned_sections || [];
                                return sections.some(s => {
                                    if (!s) return false;
                                    const cleanAssigned = s.toString().trim().toUpperCase();
                                    const cleanTarget = sec.toString().trim().toUpperCase();
                                    if (cleanAssigned === cleanTarget) return true;
                                    return false;
                                });
                            });
                            if (advisors.length > 0) facultyNames = advisors.map(a => a.full_name);
                        }

                        sectionMap[mapKey] = {
                            section: sec,
                            academicYear: academicYearLabel
                        };
                    }
                } catch (loopErr) {
                    console.error('Loop Error for user:', u.id, loopErr);
                }
            });
            console.log('Processing Loop Finished');
        }


        console.log('--- Step 9: Department Users Test ---');
        // Test fetching department users (simulating getDepartmentUsers)
        const { data: deptUsers, error: dError } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                role,
                section,
                registration_no,
                assigned_sections,
                admission_year, 
                departments!inner (
                    name
                )
            `)
            .eq('department_id', hodDeptId)
            .limit(10);

        if (dError) {
            console.error('Doepartment Users Fetch Failed:', dError);
            console.error('Full Error:', JSON.stringify(dError, null, 2));
        }
        else console.log(`Department Users Fetch Success. Found ${deptUsers.length} users.`);

    } catch (err) {
        console.error('Unexpected Script Error:', err);
    }
}

testHodStats();

