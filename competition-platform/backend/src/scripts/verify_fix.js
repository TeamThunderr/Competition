
const statsService = require('../services/admin/stats.service');
const supabase = require('../config/supabaseClient');
const fs = require('fs');

async function verifyFix() {
    try {
        console.log('--- Verifying Stats Service Fix ---');

        // 1. Verify Competition Stats for "The Last Clue" (where Smith C is a Winner)
        const compId = 'e2e6ad00-7c1e-488c-97d9-1f7eefdaa7b3'; // From debug_output.json

        const compStats = await statsService.getCompetitionStats(compId);

        const result = {
            competition: {
                id: compId,
                stats: compStats.overall,
                verified: compStats.overall.winners > 0
            },
            department: {
                id: null,
                stats: null,
                verified: false
            }
        };

        // 2. Verify Department Stats
        const deptStats = await statsService.getDepartmentStats();

        // Find the department for Smith C
        const { data: user } = await supabase
            .from('users')
            .select('department_id')
            .eq('registration_no', '24CS0001')
            .single();
        const deptId = user?.department_id;
        result.department.id = deptId;

        if (deptId) {
            const myDeptStats = deptStats.find(d => d.department_id === deptId);
            if (myDeptStats) {
                result.department.stats = {
                    name: myDeptStats.department_name,
                    winners: myDeptStats.winners,
                    shortlisted: myDeptStats.shortlisted
                };
                result.department.verified = myDeptStats.winners > 0;
            }
        }

        fs.writeFileSync('verification_result.json', JSON.stringify(result, null, 2));
        console.log('Verification output written to verification_result.json');

    } catch (err) {
        console.error('Verification Error:', err);
        fs.writeFileSync('verification_result.json', JSON.stringify({ error: err.message }, null, 2));
    }
}

verifyFix();
