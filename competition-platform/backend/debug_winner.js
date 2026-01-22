const supabase = require('./src/config/supabaseClient');

async function debugWinners() {
    console.log("--- Winner vs Shortlist Audit ---");
    const { data: statuses } = await supabase.from('competition_status').select('*');

    statuses.forEach(s => {
        if (s.is_winner && !s.is_shortlisted) {
            console.log(`User ${s.user_id} is Winner but NOT Shortlisted! Comp: ${s.competition_id}`);
        } else if (s.is_winner && s.is_shortlisted) {
            console.log(`User ${s.user_id} is Winner AND Shortlisted. OK.`);
        }
    });
}

debugWinners();
