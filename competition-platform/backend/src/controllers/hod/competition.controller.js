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
            .select('*, registrations(count), participation(count)')
            .order('registration_deadline', { ascending: true });

        if (error) {
            console.error('HOD Fetch Error:', error);
            throw error;
        }

        console.log('HOD Competitions Sample:', competitions.length > 0 ? JSON.stringify(competitions[0]) : 'No data');

        // Aggregate counts (Manual Registrations + Auto-Synced Participation)
        const enrichedCompetitions = competitions.map(comp => {
            const manualCount = comp.registrations && comp.registrations[0] ? comp.registrations[0].count : 0;
            const autoCount = comp.participation && comp.participation[0] ? comp.participation[0].count : 0;
            const totalCount = manualCount + autoCount;

            // Hack: Override registrations count for frontend compatibility
            return {
                ...comp,
                registrations: [{ count: totalCount }], // Mocked structure
                manual_count: manualCount,
                auto_count: autoCount
            };
        });

        res.status(200).json(enrichedCompetitions);
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
                .select('id, full_name, registration_no, section, admission_year')
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

        // Group students by Year -> Section
        const groups = { "2nd Year": {}, "3rd Year": {}, "4th Year": {}, "Other": {} };
        const currentYear = new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear();

        allStudents.forEach(s => {
            const diff = s.admission_year ? currentYear - s.admission_year : -1;
            let academicYear = 'Other';
            if (diff === 1) academicYear = '2nd Year';
            else if (diff === 2) academicYear = '3rd Year';
            else if (diff === 3) academicYear = '4th Year';

            const sec = s.section || 'Unknown';
            if (!groups[academicYear][sec]) groups[academicYear][sec] = [];
            groups[academicYear][sec].push(s);
        });

        // Transform to Array for Frontend
        const yearOrder = ["2nd Year", "3rd Year", "4th Year", "Other"];
        const totalSectionsData = yearOrder
            .map(year => {
                const sectionsObj = groups[year];
                if (Object.keys(sectionsObj).length === 0) return null;

                const sectionsList = Object.keys(sectionsObj).sort().map(sec => ({
                    name: sec,
                    count: sectionsObj[sec].length,
                    students: sectionsObj[sec].map(s => ({ id: s.id, name: s.full_name, regNo: s.registration_no }))
                }));

                return {
                    year: year,
                    totalStudents: sectionsList.reduce((acc, curr) => acc + curr.count, 0),
                    sections: sectionsList
                };
            })
            .filter(g => g !== null); // Remove empty years

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

        // 2b. Fetch Participation (Chunked)
        let participation = [];
        for (let i = 0; i < myStudentIds.length; i += chunkSize) {
            const chunk = myStudentIds.slice(i, i + chunkSize);
            const { data: partData, error: partError } = await supabase
                .from('participation')
                .select('student_id, confidence_score')
                .eq('competition_id', competitionId)
                .in('student_id', chunk);

            if (partError) throw partError;
            if (partData) participation = [...participation, ...partData];
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
        const registeredMap = new Map();

        // Add Manual Registrations
        registrations.forEach(r => registeredMap.set(r.user_id, { verified: r.verified, source: 'MANUAL' }));

        // Add/Merge Participation (Auto)
        participation.forEach(p => {
            if (!registeredMap.has(p.student_id)) {
                registeredMap.set(p.student_id, { verified: true, source: 'GMAIL' }); // Auto assumed verified?
            }
        });

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
