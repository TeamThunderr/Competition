const supabase = require('../config/supabaseClient');

async function testFetch() {
    console.log("Testing full schema access...");

    try {
        // 1. Registrations
        console.log("Checking Registrations...");
        const { data: r, error: re } = await supabase
            .from('registrations')
            .select('competition_id, source, verified, proof_url, status, gmail_message_id, confidence_score')
            .limit(1);
        if (re) console.error("Registrations Error:", re);
        else console.log("Registrations OK");

        // 2. Competition Status
        console.log("Checking Competition Status...");
        const { data: s, error: se } = await supabase
            .from('competition_status')
            .select('competition_id, is_shortlisted, is_winner')
            .limit(1);
        if (se) console.error("Competition Status Error:", se);
        else console.log("Competition Status OK");

        // 3. OD Requests
        console.log("Checking OD Requests...");
        const { data: o, error: oe } = await supabase
            .from('od_requests')
            .select('competition_id, status')
            .limit(1);
        if (oe) console.error("OD Requests Error:", oe);
        else console.log("OD Requests OK");

    } catch (e) {
        console.error("Crash:", e);
    }
}

testFetch();
