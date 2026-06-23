const supabase = require('../config/supabaseClient');

async function testRelation() {
    console.log("Testing competitions -> registrations(count) relation...");
    const { data, error } = await supabase
        .from('competitions')
        .select('id, registrations(count)')
        .limit(1);

    if (error) {
        console.error("❌ Relation Error:", error.message);
    } else {
        console.log("✅ Relation OK:", data);
    }
}

testRelation();
