// controllers/faculty/syncCompetition.controller.js

const supabase = require('../../config/supabaseClient');

const syncCompetition = async (req, res) => {
    try {
        const { competitionId } = req.params;
        const { department_id, section, role } = req.user;

        if (role !== 'FACULTY') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // 1. Fetch students of the faculty's section
        const { data: students, error: studentError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('department_id', department_id)
            .eq('section', section)
            .eq('role', 'STUDENT');

        if (studentError) throw studentError;

        const studentIds = students.map(s => s.id);

        // 2. Fetch registrations for the competition
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('user_id, status, verified')
            .eq('competition_id', competitionId)
            .in('user_id', studentIds);

        if (regError) throw regError;

        // 3. Aggregate status counts
        const safeSummary = {
            REGISTERED: 0,
            QUALIFIED: 0,
            WON: 0,
            PENDING: 0,
            REJECTED: 0
        };

        registrations.forEach(r => {
            let key = r.status || 'PENDING';
            if (!safeSummary.hasOwnProperty(key)) {
                key = 'PENDING';
            }
            safeSummary[key]++;
        });

        return res.status(200).json({
            competitionId,
            totalStudents: students.length,
            summary: safeSummary,
            students,
            registrations
        });

    } catch (err) {
        console.error('[SYNC COMP ERROR]', err);
        return res.status(500).json({ error: 'Sync failed' });
    }
};

module.exports = { syncCompetition };
