
const supabase = require('./src/config/supabaseClient');
require('dotenv').config();

async function createTestReg() {
    try {
        console.log("--- CREATING TEST DATA ---");

        // 1. Get a Competition
        const { data: comps } = await supabase.from('competitions').select('id, title').limit(1);
        if (!comps || comps.length === 0) {
            console.log("No competitions found! Creating one...");
            // Create dummy comp if needed... but assume at least one exists from previous chats
            return;
        }
        const comp = comps[0];
        console.log(`Using Competition: ${comp.title} (${comp.id})`);

        // 2. Get a CSE Student
        // First find CSE department ID
        const { data: dept } = await supabase.from('departments').select('id').eq('name', 'CSE').single();
        if (!dept) throw new Error("CSE Dept not found");

        const { data: users } = await supabase.from('users').select('id, full_name').eq('department_id', dept.id).eq('role', 'STUDENT').limit(1);
        if (!users || users.length === 0) throw new Error("No CSE students found");

        const user = users[0];
        console.log(`Using Student: ${user.full_name} (${user.id})`);

        // 3. Insert Registration
        const { error } = await supabase.from('registrations').insert({
            user_id: user.id,
            competition_id: comp.id,
            source: 'MANUAL_SCREENSHOT',
            verified: true
        });

        if (error) {
            if (error.code === '23505') console.log("Registration already exists.");
            else throw error;
        } else {
            console.log("SUCCESS: Created test registration.");
        }

    } catch (e) {
        console.error("ERROR:", e);
    }
}

createTestReg();
