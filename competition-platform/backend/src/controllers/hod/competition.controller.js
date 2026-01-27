// File Name: competition.controller.js (HOD)
// Purpose: Handle HOD competition view requests
// UPDATED: Removed all references to deprecated 'participation' table

const supabase = require('../../config/supabaseClient');

const getAllCompetitions = async (req, res) => {
    try {
        // Fetch competitions sorted by deadline (participation table removed)
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

        // Get counts from registrations only
        const enrichedCompetitions = competitions.map(comp => {
            const totalCount = comp.registrations && comp.registrations[0] ? comp.registrations[0].count : 0;

            return {
                ...comp,
                registrations: [{ count: totalCount }]
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


const groupStudentsBySection = (students) => {
    if (!students || students.length === 0) return [];

    // Group by Year -> Section
    const groups = { "2nd Year": {}, "3rd Year": {}, "4th Year": {}, "Other": {} };
    const currentYear = new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear();

    students.forEach(s => {
        const diff = s.admission_year ? currentYear - s.admission_year : -1;
        let academicYear = 'Other';
        if (diff === 1) academicYear = '2nd Year';
        else if (diff === 2) academicYear = '3rd Year';
        else if (diff === 3) academicYear = '4th Year';

        const sec = s.section || 'Unknown';
        if (!groups[academicYear][sec]) groups[academicYear][sec] = [];
        groups[academicYear][sec].push(s);
    });

    // Transform to Array
    const yearOrder = ["2nd Year", "3rd Year", "4th Year", "Other"];
    return yearOrder
        .map(year => {
            const sectionsObj = groups[year];
            if (Object.keys(sectionsObj).length === 0) return null;

            const sectionsList = Object.keys(sectionsObj).sort().map(sec => ({
                name: sec,
                count: sectionsObj[sec].length,
                students: sectionsObj[sec].map(s => ({
                    id: s.id,
                    name: s.full_name || s.name, // Handle cases where map might differ
                    regNo: s.registration_no || s.regNo,
                    section: s.section,
                    // Preserve extra props if they exist in source
                    verified: s.verified,
                    confidence: s.confidence,
                    status: s.status
                }))
            }));

            return {
                year: year,
                totalStudents: sectionsList.reduce((acc, curr) => acc + curr.count, 0),
                sections: sectionsList
            };
        })
        .filter(g => g !== null);
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
                registered_sections: [],
                shortlisted: []
            });
        }


        // 2. Fetch Registrations (Chunked) - Single source of truth
        let registrations = [];
        const chunkSize = 50;
        for (let i = 0; i < myStudentIds.length; i += chunkSize) {
            const chunk = myStudentIds.slice(i, i + chunkSize);
            const { data: regData, error: regError } = await supabase
                .from('registrations')
                .select('user_id, verified, source')
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
                .select('user_id, is_shortlisted, is_winner')
                .eq('competition_id', competitionId)
                .in('user_id', chunk);

            if (sError) throw sError;
            if (sData) statusData = [...statusData, ...sData];
        }

        // Map Data - registrations is now single source of truth
        const registeredMap = new Map();
        registrations.forEach(r => registeredMap.set(r.user_id, { verified: r.verified, source: r.source }));

        const shortlistedSet = new Set(statusData.filter(s => s.is_shortlisted).map(s => s.user_id));
        const winnersSet = new Set(statusData.filter(s => s.is_winner).map(s => s.user_id));

        const registeredStudents = allStudents
            .filter(s => registeredMap.has(s.id))
            .map(s => ({
                id: s.id,
                full_name: s.full_name,
                name: s.full_name, // Alias for frontend compatibility
                registration_no: s.registration_no,
                regNo: s.registration_no,
                section: s.section,
                admission_year: s.admission_year,
                verified: registeredMap.get(s.id)?.verified || false,
                confidence: registeredMap.get(s.id)?.confidence || 0
            }));

        const response = {
            total_sections: groupStudentsBySection(allStudents),
            registered: registeredStudents, // Keep flat list for counts/compatibility
            registered_sections: groupStudentsBySection(registeredStudents), // New grouped list
            shortlisted: allStudents
                .filter(s => shortlistedSet.has(s.id))
                .map(s => ({
                    id: s.id,
                    name: s.full_name,
                    regNo: s.registration_no,
                    section: s.section
                })),
            winners: allStudents
                .filter(s => winnersSet.has(s.id))
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
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
    }
};

module.exports = {
    getAllCompetitions,
    getCompetitionDetails,
    getCompetitionStats
};
