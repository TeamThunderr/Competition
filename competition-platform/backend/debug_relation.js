const supabase = require('./src/config/supabaseClient');

async function debugQuery() {
    console.log("Testing Supabase Relation Query...");

    // Try without count first to see if relation works
    const { data: relTest, error: relError } = await supabase
        .from('competitions')
        .select('id, registrations(user_id)')
        .limit(1);

    if (relError) {
        console.error("❌ Relation Query Failed:", relError);
    } else {
        console.log("✅ Relation Query Success (Sample):", JSON.stringify(relTest[0], null, 2));
    }

    // Try with count
    const { data: countTest, error: countError } = await supabase
        .from('competitions')
        .select('*, registrations(count)')
        .limit(1);

    if (countError) {
        console.error("❌ Count Query Failed:", countError);
    } else {
        console.log("✅ Count Query Success (Sample):", JSON.stringify(countTest[0], null, 2));
    }
}

debugQuery();
