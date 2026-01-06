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
        // Filter by assigned sections
        const allowedSections = assigned_sections
            ? assigned_sections.map(s => {
                const parts = s.split('-');
                return parts.length > 1 ? parts[parts.length - 1].trim() : s.trim();
            })
            : [];

        console.log(`[FacultyComp] Faculty ${req.user.id}, Allowed Sections:`, allowedSections);

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

        // 2. Fetch Registrations (Source of Truth)
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('competition_id', competitionId)
            .in('user_id', myStudentIds);

        if (regError) throw regError;

        const regMap = new Map(registrations?.map(r => [r.user_id, r]) || []);

        // 3. Fetch Competition Status (Shortlisted/Winner)
        const { data: compStatus, error: statusError } = await supabase
            .from('competition_status')
            .select('*')
            .eq('competition_id', competitionId)
            .in('user_id', myStudentIds);

        if (statusError) throw statusError;

        const statusMap = new Map(compStatus?.map(s => [s.user_id, s]) || []);

        const response = {
            total: myStudents.map(s => ({
                id: s.id,
                name: s.full_name,
                regNo: s.registration_no,
                section: s.section
            })),

            registered: myStudents
                .filter(s => {
                    // Check if they are in registrations table
                    // AND NOT shortlisted (optional, if we want mutually exclusive lists)
                    // Usually "Registered" list implies everyone who registered.
                    // But if the UI has "Registered" and "Shortlisted" as separate tabs/columns, 
                    // we might want to show them in both?
                    // Previous logic: p.status === 'REGISTERED'
                    // If p.status was 'SHORTLISTED', they were NOT in 'registered' array.
                    // So let's mimic that: purely registered (no special status yet).

                    const isReg = regMap.has(s.id);
                    const isShort = statusMap.get(s.id)?.is_shortlisted;
                    return isReg && !isShort;
                })
                .map(s => {
                    const r = regMap.get(s.id);
                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: 'Registered',
                        source: r.source,
                        confidence: 100, // Manual/Confirmed
                        verified: r.verified,
                        remarks: r.proof_url ? 'Manual Upload' : 'Gmail Match'
                    };
                }),

            shortlisted: myStudents
                .filter(s => {
                    const st = statusMap.get(s.id);
                    return st && (st.is_shortlisted || st.is_winner);
                })
                .map(s => {
                    const st = statusMap.get(s.id);
                    const statusLabel = st.is_winner ? 'Winner' : 'Shortlisted';
                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: statusLabel
                    };
                }),

            unregistered: myStudents
                .filter(s => {
                    const isReg = regMap.has(s.id);
                    const isShort = statusMap.get(s.id)?.is_shortlisted;
                    // If NOT registered AND NOT shortlisted
                    return !isReg && !isShort;
                })
                .map(s => {
                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: 'NOT_REGISTERED',
                        lastSynced: null,
                        confidence: 0,
                        remarks: ''
                    };
                })
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
