// File Name: seed.js
// Purpose: Populate the database with dummy users (Students, Faculty, HODs)
// Written for beginner developers
// Run this using: node src/scripts/seed.js

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Use SERVICE_KEY for seeding to bypass RLS and Rate Limits
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: SUPABASE_URL or SUPABASE_KEY is missing in .env");
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn("⚠️ Warning: Using ANON key. Seeding might fail due to RLS policies. Please add SUPABASE_SERVICE_KEY to .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
    console.log("🌱 Starting Database Seeding...");

    try {
        // 1. Create Departments
        console.log("Step 1: Creating Departments (CSE, AIDS)...");
        const depts = [
            { name: 'CSE' },
            { name: 'AIDS' }
        ];

        // Upsert departments
        const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .upsert(depts, { onConflict: 'name' })
            .select();

        if (deptError) throw deptError;

        const cseId = deptData.find(d => d.name === 'CSE').id;
        const aidsId = deptData.find(d => d.name === 'AIDS').id;

        console.log(`- Departments Created: CSE (${cseId}), AIDS (${aidsId})`);

        // 2. Create HODs
        console.log("Step 2: Creating HODs...");
        const hods = [
            {
                email: 'hodcse@citchennai.net',
                full_name: 'HOD CSE',
                role: 'HOD',
                department_id: cseId
            },
            {
                email: 'hodaids@citchennai.net',
                full_name: 'HOD AIDS',
                role: 'HOD',
                department_id: aidsId
            }
        ];

        const { error: hodError } = await supabase.from('users').upsert(hods, { onConflict: 'email' });
        if (hodError) throw hodError;
        console.log("- HODs Created");

        // 3. Create Faculty (30 Faculty for 30 Sections)
        // CSE has Sections A-Q (17 sections)
        // AIDS has Sections A-M (13 sections)
        // Total = 30
        console.log("Step 3: Creating Faculty...");
        const facultyUsers = [];
        const sectionsCse = 'ABCDEFGHIJKLMNOPQ'.split(''); // 17
        const sectionsAids = 'ABCDEFGHIJKLM'.split(''); // 13

        let facultyCount = 1;

        // Helper to generate section char
        const assignFaculty = (deptId, sections) => {
            for (const sec of sections) {
                facultyUsers.push({
                    email: `faculty${facultyCount}@citchennai.net`,
                    full_name: `Faculty ${facultyCount}`,
                    role: 'FACULTY',
                    department_id: deptId,
                    assigned_sections: [sec] // Array type
                });
                facultyCount++;
            }
        };

        assignFaculty(cseId, sectionsCse);
        assignFaculty(aidsId, sectionsAids);

        // Batched insert for faculty
        const { error: facError } = await supabase.from('users').upsert(facultyUsers, { onConflict: 'email' });
        if (facError) throw facError;
        console.log(`- ${facultyUsers.length} Faculty Created`);

        // 4. Create Students (1800 Students)
        console.log("Step 4: Creating Students (This may take a moment)...");
        const students = [];
        // Student 1-1020 -> CSE (17 sections * 60)
        // Student 1021-1800 -> AIDS (13 sections * 60)

        const BATCH_SIZE = 100; // Supabase limit per request

        // Helper for CSE
        for (let i = 0; i < 1020; i++) {
            const num = i + 1;
            const sectionIndex = Math.floor(i / 60);
            const section = sectionsCse[sectionIndex];
            // Roll No: 24CS0001
            const rollNo = `24CS${String(num).padStart(4, '0')}`;

            students.push({
                email: `student${num}@citchennai.net`,
                full_name: `Student ${num}`,
                role: 'STUDENT',
                department_id: cseId,
                section: section,
                registration_no: rollNo,
                year: 2,
                cgpa: 8.5,
                attendance: 90.0,
                phone_number: `98765${String(num).padStart(5, '0')}`
            });
        }

        // Helper for AIDS
        for (let i = 0; i < 780; i++) {
            const absoluteNum = 1020 + i + 1;
            const relativeNum = i + 1;
            const sectionIndex = Math.floor(i / 60);
            const section = sectionsAids[sectionIndex];
            // Roll No: 24AD0001
            const rollNo = `24AD${String(relativeNum).padStart(4, '0')}`;

            students.push({
                email: `student${absoluteNum}@citchennai.net`,
                full_name: `Student ${absoluteNum}`,
                role: 'STUDENT',
                department_id: aidsId,
                section: section,
                registration_no: rollNo,
                year: 2,
                cgpa: 8.5,
                attendance: 90.0,
                phone_number: `98765${String(absoluteNum).padStart(5, '0')}`
            });
        }

        console.log(`- Prepared ${students.length} students. Inserting in batches of ${BATCH_SIZE}...`);

        for (let i = 0; i < students.length; i += BATCH_SIZE) {
            const batch = students.slice(i, i + BATCH_SIZE);
            const { error: stuError } = await supabase.from('users').upsert(batch, { onConflict: 'email' });
            if (stuError) {
                console.error(`Error inserting batch ${i}:`, stuError.message);
            } else {
                process.stdout.write('.');
            }
        }
        console.log("\n- Students Created");

    } catch (err) {
        console.error("Seeding Failed:", err);
    }
}

seedDatabase();
