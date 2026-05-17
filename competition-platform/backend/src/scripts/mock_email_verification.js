const supabase = require('../config/supabaseClient');

const mockVerification = async () => {
    console.log('🧪 Starting Mock Email Verification...');

    // Configuration
    const targetEmails = [
        'smithc.cse2024@citchennai.net',
        'balajiv.cse2024@citchennai.net'
    ];
    const competitionTitle = 'Test Competition 1'; // Ensure this matches what you seeded

    // 1. Get Competition ID
    const { data: comp, error: compError } = await supabase
        .from('competitions')
        .select('id')
        .eq('title', competitionTitle)
        .maybeSingle();

    if (compError) {
        console.error('❌ Error fetching competition:', compError.message);
        return;
    }
    if (!comp) {
        console.error(`❌ Competition '${competitionTitle}' not found. Run 'npm run seed:competitions' first.`);
        return;
    }

    console.log(`🎯 Target Competition: ${competitionTitle} (${comp.id})`);

    // 2. Process Users
    for (const email of targetEmails) {
        console.log(`\n🔍 Looking up user: ${email}`);

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('email', email)
            .maybeSingle();

        if (userError) {
            console.error(`   ❌ DB Error: ${userError.message}`);
            continue;
        }

        if (!user) {
            console.warn(`   ⚠️ User not found in database. Skipping.`);
            continue;
        }

        console.log(`   ✅ Found User: ${user.full_name} (${user.id})`);

        // 3. Insert/Update Registration
        const { error: regError } = await supabase
            .from('registrations')
            .upsert({
                user_id: user.id,
                competition_id: comp.id,
                source: 'MOCK_SCRIPT',
                verified: true,
                registered_at: new Date().toISOString(),
                proof_url: 'mock_http_proof'
            }, { onConflict: 'user_id, competition_id' });

        if (regError) {
            console.error(`   ❌ Update Failed: ${regError.message}`);
        } else {
            console.log(`   ✅ SUCCESS: Marked as verified.`);
        }

        // 4. Also update status to Shortlisted for testing "Qualified" flows
        // Uncomment if you want to test qualification
        /*
        const { error: statusError } = await supabase
            .from('competition_status')
            .upsert({
                user_id: user.id,
                competition_id: comp.id,
                is_shortlisted: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, competition_id' });
        
        if (!statusError) console.log(`   ✅ SUCCESS: Marked as Shortlisted (Optional)`);
        */
    }

    console.log('\n🏁 Mock Verification Complete.');
    process.exit(0);
};

mockVerification();
