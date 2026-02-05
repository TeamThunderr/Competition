const supabase = require('../config/supabaseClient');

async function checkOD() {
    console.log("Checking OD Requests table...");
    const { data, error } = await supabase
        .from('od_requests')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ OD Requests Error:", error.message);
    } else {
        console.log("✅ OD Requests OK");
    }
}

checkOD();
