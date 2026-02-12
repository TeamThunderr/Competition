
const supabase = require('../config/supabaseClient');
const fs = require('fs');

async function debugStudentStats() {
    try {
        console.log('Starting debug script...');
        const regNo = '24CS0001'; // From screenshot

        // 1. Get User ID
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('registration_no', regNo)
            .single();

        if (userError || !user) {
            console.error('User not found:', userError);
            return;
        }
        console.log(`User found: ${user.full_name} (${user.id})`);

        // 2. Get Registrations
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('id, competition_id, status, verified, qualification_verified, competitions(title)')
            .eq('user_id', user.id);

        if (regError) {
            console.error('Error fetching registrations:', regError);
            return;
        }

        console.log('\n--- REGISTRATIONS TABLE ---');
        registrations.forEach(r => {
            console.log(`Comp: ${r.competitions?.title}, Status: ${r.status}, Verified: ${r.verified}, QualVerified: ${r.qualification_verified}`);
        });

        // 3. Get Competition Status
        const { data: compStatus, error: csError } = await supabase
            .from('competition_status')
            .select('competition_id, is_shortlisted, is_winner')
            .eq('user_id', user.id);

        if (csError) {
            console.error('Error fetching competition_status:', csError);
            return;
        }

        const output = {
            registrations: registrations.map(r => ({
                id: r.id,
                competition_id: r.competition_id,
                competition_title: r.competitions?.title,
                status: r.status,
                verified: r.verified,
                qualification_verified: r.qualification_verified
            })),
            competition_status: compStatus.map(cs => {
                const comp = registrations.find(r => r.competition_id === cs.competition_id)?.competitions?.title || 'Unknown';
                return {
                    competition_id: cs.competition_id,
                    competition_title: comp,
                    is_shortlisted: cs.is_shortlisted,
                    is_winner: cs.is_winner,
                    rounds_cleared: cs.rounds_cleared
                };
            }),
            comparison: []
        };

        // 4. Compare
        registrations.forEach(r => {
            const cs = compStatus.find(c => c.competition_id === r.competition_id);
            if (cs) {
                let calculatedStatus = 'Registered';
                if (cs.is_winner) calculatedStatus = 'Won';
                else if (cs.is_shortlisted) calculatedStatus = 'Qualified';

                output.comparison.push({
                    comp: r.competitions?.title,
                    regStatus: r.status,
                    csWinner: cs.is_winner,
                    csShortlisted: cs.is_shortlisted,
                    calculated: calculatedStatus,
                    match: calculatedStatus === (r.status === 'Winner' ? 'Won' : (r.status === 'Qualified' || r.status === 'SHORTLISTED') ? 'Qualified' : r.status)
                });
            }
        });

        fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
        console.log('Output written to debug_output.json');

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugStudentStats();
