
const supabase = require('../config/supabaseClient');

async function debugDB() {
    try {
        console.log("Debugging DB...");

        // 1. Check Participation
        const { count: pCount, error: pError } = await supabase.from('participation').select('*', { count: 'exact', head: true });
        console.log(`Participation Count: ${pCount} (Error: ${pError?.message})`);

        // 2. Check Registrations
        const { count: rCount, error: rError } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
        console.log(`Registrations Count: ${rCount} (Error: ${rError?.message})`);

        // 3. Try to Fetch One User (to use for test insert)
        const { data: user } = await supabase.from('users').select('id').eq('role', 'STUDENT').limit(1).single();
        const { data: comp } = await supabase.from('competitions').select('id').limit(1).single();

        if (user && comp) {
            console.log(`Test User: ${user.id}, Test Comp: ${comp.id}`);

            // 4. Try INSERT to Registrations
            console.log("Attempting Test Insert to Registrations...");
            const testPayload = {
                user_id: user.id,
                competition_id: comp.id,
                status: 'REGISTERED',
                source: 'MANUAL_TEST',
                verified: true,
                registered_at: new Date().toISOString()
            };

            const { data: insData, error: insError } = await supabase.from('registrations').insert(testPayload).select();
            if (insError) {
                console.error("Insert Failed:", insError.message);
                console.error("Details:", insError.details);
            } else {
                console.log("Insert Success:", insData);
                // Clean up
                await supabase.from('registrations').delete().eq('id', insData[0].id);
                console.log("Cleaned up test row.");
            }
        } else {
            console.log("Could not find user/comp for test.");
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

debugDB();
