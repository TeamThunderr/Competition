const controller = require('./src/controllers/faculty/team_verification.controller');
const supabase = require('./src/config/supabaseClient');

async function simulate() {
    console.log("--- Simulating Controller ---");

    // 1. Mock Request/Response
    const { data: faculty } = await supabase.from('users').select('*').eq('email', 'faculty1@citchennai.net').single();
    if (!faculty) { console.log("No Faculty"); return; }

    // Set headers or mock user object as middleware would
    const req = {
        user: {
            id: faculty.id,
            department_id: faculty.department_id,
            assigned_sections: faculty.assigned_sections
        },
        headers: {}
    };

    const res = {
        status: (code) => {
            console.log(`STATUS: ${code}`);
            return res;
        },
        json: (data) => {
            console.log("RESPONSE DATA:");
            // Check if we found any teams
            if (Array.isArray(data) && data.length > 0) {
                console.log(`✅ SUCCESS! Found ${data.length} teams.`);
                data.forEach(t => console.log(`- ${t.teamName} (Leader: ${t.leaderName})`));
            } else {
                console.log("❌ FAIL. No teams returned.");
            }
            return res;
        }
    };

    // 2. Run
    await controller.getPendingTeamVerifications(req, res);
}

simulate();
