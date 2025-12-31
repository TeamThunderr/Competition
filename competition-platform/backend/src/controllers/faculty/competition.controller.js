// File Name: competition.controller.js (Faculty)
// Purpose: Handle faculty competition view requests
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const getAllCompetitions = async (req, res) => {
    try {
        // Fetch competitions sorted by deadline
        // Does NOT fetch registration status as faculty don't register
        const { data: competitions, error } = await supabase
            .from('competitions')
            .select('*, registrations(count)')
            .order('registration_deadline', { ascending: false });

        if (error) throw error;

        res.status(200).json(competitions);
    } catch (err) {
        console.error('Error fetching competitions (Faculty):', err);
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



// 3. Get Students for specific competition (Total, Registered, Shortlisted)
const getCompetitionStudents = async (req, res) => {
    try {
        const { id: competitionId } = req.params;
        const { assigned_sections, department_id } = req.user;



        // 1. Fetch ALL Students in Faculty's Sections
        // Reuse logic: Fetch all dept students, then filter by section
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

            if (error) {
                console.error('[FacultyComp] DB Error fetching users:', error);
                throw error;
            }


            allStudents = [...allStudents, ...pageData];
            page++;
            if (pageData.length < pageSize) hasMore = false;
        }

        // Filter by assigned sections
        const allowedSections = assigned_sections
            ? assigned_sections.map(s => s.split('-')[1] || s).map(s => s.trim())
            : [];

        const myStudents = allStudents.filter(s => {
            if (allowedSections.length === 0) return true;
            return allowedSections.includes(s.section);
        }).sort((a, b) => a.registration_no.localeCompare(b.registration_no));

        const myStudentIds = myStudents.map(s => s.id);

        if (myStudentIds.length === 0) {
            return res.status(200).json({
                total: [],
                registered: [],
                shortlisted: []
            });
        }

        // 2. Fetch Registrations for this Competition
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('user_id, verified')
            .eq('competition_id', competitionId)
            .in('user_id', myStudentIds);

        if (regError) throw regError;

        // 3. Fetch Shortlisted Status
        const { data: statusData, error: statusError } = await supabase
            .from('competition_status')
            .select('user_id, is_shortlisted')
            .eq('competition_id', competitionId)
            .in('user_id', myStudentIds)
            .eq('is_shortlisted', true);

        if (statusError) throw statusError;

        // Map Data for Frontend
        // Total Students: Just names/regNo
        // Registered: Name + RegNo + Verified Status
        // Shortlisted: Name + RegNo

        const registeredMap = new Map(registrations.map(r => [r.user_id, r]));
        const shortlistedSet = new Set(statusData.map(s => s.user_id));

        const response = {
            total: myStudents.map(s => ({
                id: s.id,
                name: s.full_name,
                regNo: s.registration_no,
                section: s.section
            })),
            registered: myStudents
                .filter(s => registeredMap.has(s.id))
                .map(s => ({
                    id: s.id,
                    name: s.full_name,
                    regNo: s.registration_no,
                    verified: registeredMap.get(s.id).verified
                })),
            shortlisted: myStudents
                .filter(s => shortlistedSet.has(s.id))
                .map(s => ({
                    id: s.id,
                    name: s.full_name,
                    regNo: s.registration_no
                }))
        };

        res.status(200).json(response);

    } catch (err) {
        console.error('Error fetching competition students:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getAllCompetitions,
    getCompetitionDetails,
    getCompetitionStudents
};
