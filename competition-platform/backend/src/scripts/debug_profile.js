const supabase = require('../config/supabaseClient');

async function testProfileQueries() {
    console.log("Testing competition_status with join...");
    const { data, error } = await supabase
        .from('competition_status')
        .select('is_winner, is_shortlisted, competition_id, competitions(title)')
        .limit(1);

    if (error) {
        console.error("❌ Join Error:", error.message);
    } else {
        console.log("✅ Join OK:", JSON.stringify(data, null, 2));
    }
}

testProfileQueries();
