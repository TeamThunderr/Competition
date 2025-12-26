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

            allStudents = [...allStudents, ...pageData];
            page++;
            if (pageData.length < pageSize) hasMore = false;
        }

        const myStudentIds = allStudents.map(s => s.id);

        // Group students by section for the "Sections" column
        const studentsBySection = {};
        allStudents.forEach(s => {
            const sec = s.section || 'Unknown';
            if (!studentsBySection[sec]) studentsBySection[sec] = [];
            studentsBySection[sec].push(s);
        });

        // HOD View: "Total Section" -> We will return list of sections with their student counts
        const totalSectionsData = Object.keys(studentsBySection).map(sec => ({
            name: sec,
            count: studentsBySection[sec].length,
            students: studentsBySection[sec].map(s => ({ id: s.id, name: s.full_name, regNo: s.registration_no }))
        }));

        if (myStudentIds.length === 0) {
            return res.status(200).json({
                total_sections: [],
                registered: [],
                shortlisted: []
            });
        }

        // 2. Fetch Registrations for HOD's Department
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('user_id, verified')
            .eq('competition_id', competitionId)
            .in('user_id', myStudentIds);

        if (regError) throw regError;

        // 3. Fetch Shortlisted (HOD's Dept)
        const { data: statusData, error: statusError } = await supabase
            .from('competition_status')
            .select('user_id, is_shortlisted')
            .eq('competition_id', competitionId)
            .in('user_id', myStudentIds)
            .eq('is_shortlisted', true);

        if (statusError) throw statusError;

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
                    verified: registeredMap.get(s.id).verified
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
        console.error('Error fetching HOD stats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getAllCompetitions,
    getCompetitionDetails,
    getCompetitionStats
};
