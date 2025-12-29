// File Name: competition.controller.js (HOD)
// Purpose: Handle HOD competition view requests
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const getAllCompetitions = async (req, res) => {
    try {
        // Fetch competitions sorted by deadline
        console.log("HOD Controller - Fetching competitions");
        const { data: competitions, error } = await supabase
            .from('competitions')
            .select('*, registrations(count)')
            .order('registration_deadline', { ascending: true });

        if (error) {
            console.error('HOD Fetch Error:', error);
            throw error;
        }

        console.log('HOD Competitions Sample:', competitions.length > 0 ? JSON.stringify(competitions[0]) : 'No data');

        res.status(200).json(competitions);
    } catch (err) {
        console.error('Error fetching competitions (HOD):', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCompetitionDetails = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching competition details:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCompetitionStats = async (req, res) => {
    try {
        const { id: competitionId } = req.params;
        const { department_id } = req.user;

        console.log(`[HOD Stats] Fetching for Comp: ${competitionId}, Dept: ${department_id}`);

        // 1. Fetch Students in HOD's Department
        let allStudents = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error } = await supabase
                .from('users')
                .select('id, full_name, registration_no, section')
                .eq('role', 'STUDENT')
                .eq('department_id', department_id)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;

            if (pageData.length > 0) {
                allStudents = [...allStudents, ...pageData];
                page++;
                if (pageData.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        const myStudentIds = allStudents.map(s => s.id);

        if (myStudentIds.length === 0) {
            return res.status(200).json({
                total_sections: [],
                registered: [],
                shortlisted: []
            });
        }

        // Group students by section
        const studentsBySection = {};
        allStudents.forEach(s => {
            const sec = s.section || 'Unknown';
            if (!studentsBySection[sec]) studentsBySection[sec] = [];
            studentsBySection[sec].push(s);
        });

        const totalSectionsData = Object.keys(studentsBySection).map(sec => ({
            name: sec,
            count: studentsBySection[sec].length,
            students: studentsBySection[sec].map(s => ({ id: s.id, name: s.full_name, regNo: s.registration_no }))
        }));

        // 2. Fetch Registrations (Chunked to avoid URL length issues)
        let registrations = [];
        const chunkSize = 50;
        for (let i = 0; i < myStudentIds.length; i += chunkSize) {
            const chunk = myStudentIds.slice(i, i + chunkSize);
            const { data: regData, error: regError } = await supabase
                .from('registrations')
                .select('user_id, verified')
                .eq('competition_id', competitionId)
                .in('user_id', chunk);

            if (regError) throw regError;
            if (regData) registrations = [...registrations, ...regData];
        }

        // 3. Fetch Shortlisted (Chunked)
        let statusData = [];
        for (let i = 0; i < myStudentIds.length; i += chunkSize) {
            const chunk = myStudentIds.slice(i, i + chunkSize);
            const { data: sData, error: sError } = await supabase
                .from('competition_status')
                .select('user_id, is_shortlisted')
                .eq('competition_id', competitionId)
                .in('user_id', chunk)
                .eq('is_shortlisted', true);

            if (sError) throw sError;
            if (sData) statusData = [...statusData, ...sData];
        }

        // Map Data
        const registeredMap = new Map(registrations.map(r => [r.user_id, r]));
        const shortlistedSet = new Set(statusData.map(s => s.user_id));

        const response = {
            total_sections: totalSectionsData,
            registered: allStudents
                .filter(s => registeredMap.has(s.id))
                .map(s => ({
                    id: s.id,
                    name: s.full_name,
                    regNo: s.registration_no,
                    section: s.section,
                    verified: registeredMap.get(s.id)?.verified || false
                })),
            shortlisted: allStudents
                .filter(s => shortlistedSet.has(s.id))
                .map(s => ({
                    id: s.id,
                    name: s.full_name,
                    regNo: s.registration_no,
                    section: s.section
                }))
        };

        res.status(200).json(response);

    } catch (err) {
        console.error('[HOD Stats] Error:', err);
        // Return 500 with message
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
    }
};

module.exports = {
    getAllCompetitions,
    getCompetitionDetails,
    getCompetitionStats
};
