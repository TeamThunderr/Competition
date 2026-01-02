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

        // 2. Fetch Participation Logic (NEW)
        const { data: participation, error: partError } = await supabase
            .from('participation')
            .select('*')
            .eq('competition_id', competitionId)
            .in('student_id', myStudentIds);

        if (partError) throw partError;

        const partMap = new Map(participation?.map(p => [p.student_id, p]) || []);

        // 3. Fallback to Registrations (Legacy Support - Optional)
        // If we want to support both tables during migration, we would merge. 
        // For this task, we assume participation is the Source of Truth.
        // However, if participation is empty, we might miss manual registrations from old system?
        // Let's do a simple merge if needed, or just rely on participation.
        // Given prompt "Participation (MOST IMPORTANT TABLE)", I will rely on it.
        // But since I assume the DB might have old data in 'registrations' not 'participation', 
        // I should probably Sync? No, I'll rely on Participation.

        const response = {
            total: myStudents.map(s => ({
                id: s.id,
                name: s.full_name,
                regNo: s.registration_no,
                section: s.section
            })),

            registered: myStudents
                .filter(s => {
                    const p = partMap.get(s.id);
                    return p && (p.status === 'REGISTERED');
                })
                .map(s => {
                    const p = partMap.get(s.id);
                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: p.status,
                        source: p.verification_source,
                        confidence: p.confidence_score,
                        verified: !!p.verified_by, // Confirmed
                        remarks: p.remarks
                    };
                }),

            shortlisted: myStudents
                .filter(s => {
                    const p = partMap.get(s.id);
                    return p && (p.status === 'SHORTLISTED' || p.status === 'QUALIFIED');
                })
                .map(s => ({
                    id: s.id,
                    name: s.full_name,
                    regNo: s.registration_no,
                    status: 'Shortlisted'
                })),

            unregistered: myStudents
                .filter(s => {
                    const p = partMap.get(s.id);
                    // If no row, or status is NOT_REGISTERED or PENDING or REJECTED
                    if (!p) return true;
                    return ['NOT_REGISTERED', 'PENDING', 'REJECTED', 'ACTION_REQUIRED'].includes(p.status);
                })
                .map(s => {
                    const p = partMap.get(s.id);
                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: p ? p.status : 'NOT_REGISTERED',
                        lastSynced: p ? p.last_synced_at : null,
                        confidence: p ? p.confidence_score : 0,
                        remarks: p ? p.remarks : ''
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
