const supabase = require('./src/config/supabaseClient');
const fs = require('fs');

const verifyProfileLogic = async () => {
    const email = 'smithc.cse2024@citchennai.net';
    const { data: users } = await supabase.from('users').select('id, full_name').eq('email', email);
    if (!users || users.length === 0) return;
    const userId = users[0].id;

    const { data: registrations } = await supabase.from('registrations').select('status, verified, shortlist_verified, qualification_verified, competitions(title)').eq('user_id', userId);
    if (!registrations) return;

    // Refined logic
    const verifiedRegistrations = registrations.filter(r => r.verified === true);
    const qualifiedRegistrations = registrations.filter(r =>
        (r.status === 'Qualified' || r.status === 'SHORTLISTED') &&
        (r.qualification_verified === true || r.shortlist_verified === true)
    );

    const result = {
        user: users[0].full_name,
        totalParticipated: verifiedRegistrations.length,
        totalQualified: qualifiedRegistrations.length,
        qualifiedCompetitions: qualifiedRegistrations.map(r => r.competitions?.title),
        excludedQualified: registrations.filter(r =>
            (r.status === 'Qualified' || r.status === 'SHORTLISTED') &&
            !(r.qualification_verified === true || r.shortlist_verified === true)
        ).map(r => r.competitions?.title)
    };

    fs.writeFileSync('verify_result.json', JSON.stringify(result, null, 2));
};

verifyProfileLogic();
