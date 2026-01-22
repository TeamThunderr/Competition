require('dotenv').config();
const supabase = require('./src/config/supabaseClient');

const getFacultySectionMap = async () => {
    console.log('Fetching faculty map...');
    const { data: facultyList, error } = await supabase
        .from('users')
        .select('id, full_name, assigned_sections, department_id, departments(name)')
        .eq('role', 'FACULTY');

    if (error) {
        console.error('Error fetching faculty for mapping:', error);
        return {};
    }

    const map = {};
    facultyList.forEach(faculty => {
        if (faculty.assigned_sections && Array.isArray(faculty.assigned_sections)) {
            faculty.assigned_sections.forEach(sec => {
                let targetDeptName = faculty.departments?.name;
                let targetSection = sec.trim();

                const parts = sec.split('-');
                if (parts.length > 1) {
                    targetDeptName = parts[0].trim();
                    targetSection = parts[1].trim();
                }

                if (targetDeptName && targetSection) {
                    const key = targetDeptName.toUpperCase() + '_' + targetSection.toUpperCase();
                    if (!map[key]) {
                        map[key] = faculty.full_name;
                    }
                }
            });
        }
    });
    console.log(`Faculty map created with ${Object.keys(map).length} entries.`);
    return map;
};

const testSearch = async (searchTerm) => {
    console.log(`Testing search with term: "${searchTerm}"`);

    let query = supabase
        .from('users')
        .select(`
            id,
            full_name,
            email,
            registration_no,
            section,
            departments ( name )
        `)
        .eq('role', 'STUDENT');

    if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,registration_no.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.limit(5);

    if (error) {
        console.error('SEARCH ERROR:', error);
        return;
    }

    console.log(`Found ${data.length} results.`);

    try {
        const facultyRef = await getFacultySectionMap();
        const enrichedData = data.map(student => {
            let assigned = 'N/A';
            if (student.departments?.name && student.section) {
                const key = `${student.departments.name.trim().toUpperCase()}_${student.section.trim().toUpperCase()}`;
                assigned = facultyRef[key] || 'Not Assigned';
            }
            return {
                ...student,
                assigned_faculty: assigned
            };
        });

        if (enrichedData.length > 0) {
            console.log('Sample enriched result:', JSON.stringify(enrichedData[0], null, 2));
        }
    } catch (err) {
        console.error('ENRICHMENT ERROR:', err);
    }
};

const run = async () => {
    await testSearch('23');
};

run();
