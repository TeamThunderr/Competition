// File Name: competition.controller.js (Faculty)
// Purpose: Handle faculty competition view requests
// UPDATED: Removed all participation table references - uses registrations only

const supabase = require('../../config/supabaseClient');
const { getAcademicYearLabel } = require('../../utils/academicYear.util');
const { buildXlsxBuffer } = require('../../utils/exportHelper');

const getAllCompetitions = async (req, res) => {
    try {
        const { id: facultyId, department_id, assigned_sections } = req.user;

        if (!department_id) {
            console.log('[FacultyComp] No department assigned to faculty');
            return res.status(200).json([]);
        }

        // 1. Get Faculty's Student IDs
        const { data: students, error: studentError } = await supabase
            .from('users')
            .select('id, section')
            .eq('department_id', department_id)
            .eq('role', 'STUDENT');

        if (studentError) throw studentError;

        const allowedSections = (assigned_sections || []).map(s => {
            const parts = s.split('-');
            return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : s.trim().toUpperCase();
        });

        const myStudentIds = students
            .filter(s => allowedSections.includes((s.section || '').trim().toUpperCase()))
            .map(s => s.id);

        // 2. Fetch Competitions with Registration Counts for THESE students
        // Note: Supabase doesn't support complex filtered joins easily in one go.
        // We will fetch competitions and then fetch counts in parallel or via a second query.

        const { data: competitions, error: compError } = await supabase
            .from('competitions')
            .select('*')
            .order('registration_deadline', { ascending: true });

        if (compError) throw compError;

        // 3. Fetch Registration Counts for My Students
        const { data: regCounts, error: countError } = await supabase
            .from('registrations')
            .select('competition_id')
            .eq('verified', true)
            .in('user_id', myStudentIds);

        if (countError) throw countError;

        // Aggregating counts
        const countMap = {};
        regCounts.forEach(r => {
            countMap[r.competition_id] = (countMap[r.competition_id] || 0) + 1;
        });

        // 4. Merge Data
        const enrichedCompetitions = competitions.map(c => ({
            ...c,
            registrations: [{ count: countMap[c.id] || 0 }]
        }));

        res.status(200).json(enrichedCompetitions);
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

// Get Students for specific competition (Total, Registered, Shortlisted)
const getCompetitionStudents = async (req, res) => {
    try {
        const { id: competitionId } = req.params;
        const { assigned_sections, department_id } = req.user;

        if (!department_id) {
            return res.status(200).json({
                total: [],
                registered: [],
                shortlisted: [],
                unregistered: []
            });
        }

        // 1. Fetch ALL Students in Faculty's Sections
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

        // Filter by assigned sections (Case Insensitive)
        const allowedSections = assigned_sections
            ? assigned_sections.map(s => {
                const parts = s.split('-');
                return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : s.trim().toUpperCase();
            })
            : [];

        console.log(`[FacultyComp] Faculty ${req.user.id}, Allowed Sections:`, allowedSections);

        const myStudents = allStudents.filter(s => {
            if (allowedSections.length === 0) return true;
            return allowedSections.includes((s.section || '').trim().toUpperCase());
        }).sort((a, b) => a.registration_no.localeCompare(b.registration_no));

        const myStudentIds = myStudents.map(s => s.id);

        if (myStudentIds.length === 0) {
            return res.status(200).json({
                total: [],
                registered: [],
                shortlisted: [],
                unregistered: []
            });
        }

        // 2. Fetch Registrations (Single Source of Truth)
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('competition_id', competitionId)
            .in('user_id', myStudentIds);

        if (regError) throw regError;

        const regMap = new Map(registrations?.map(r => [r.user_id, r]) || []);

        // 3. Fetch Competition Status (Shortlisted Only)
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
                    const isReg = regMap.has(s.id);
                    const st = statusMap.get(s.id);
                    const isShort = st?.is_shortlisted;
                    const isWinner = st?.is_winner;
                    return isReg && !isShort && !isWinner;
                })
                .map(s => {
                    const r = regMap.get(s.id);
                    const source = r?.source || 'UNKNOWN';
                    const verified = r?.verified || false;
                    const confidence = source === 'AUTO_GMAIL' ? (r?.confidence_score || 100) : (r?.confidence_score || 0);
                    let remarks = '';
                    if (source === 'AUTO_GMAIL') {
                        remarks = 'Gmail Verified';
                    } else if (r?.proof_url) {
                        remarks = verified ? 'Manual Verified' : 'Pending Verification';
                    }

                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: 'Registered',
                        source: source,
                        confidence: confidence,
                        verified: verified,
                        remarks: remarks
                    };
                }),

            shortlisted: myStudents
                .filter(s => {
                    const isReg = regMap.has(s.id);
                    const st = statusMap.get(s.id);
                    return isReg && st?.is_shortlisted && !st?.is_winner;
                })
                .map(s => {
                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: 'Shortlisted'
                    };
                }),

            winners: myStudents
                .filter(s => {
                    const isReg = regMap.has(s.id);
                    const st = statusMap.get(s.id);
                    return isReg && st?.is_winner;
                })
                .map(s => {
                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: 'Winner'
                    };
                }),

            unregistered: myStudents
                .filter(s => !regMap.has(s.id))
                .map(s => {
                    const isReg = regMap.has(s.id);
                    return {
                        id: s.id,
                        name: s.full_name,
                        regNo: s.registration_no,
                        status: isReg ? 'PENDING' : 'NOT_REGISTERED',
                        lastSynced: null,
                        confidence: 0,
                        remarks: ''
                    };
                })
                .sort((a, b) => {
                    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                    return a.regNo.localeCompare(b.regNo);
                })
        };

        // Debug logging
        console.log(`[FacultyComp] Competition ${competitionId}:`);
        console.log(`  - Total students: ${myStudents.length}`);
        console.log(`  - Registered: ${response.registered.length}`);
        console.log(`  - Unregistered: ${response.unregistered.length}`);
        console.log(`  - Shortlisted: ${response.shortlisted.length}`);

        res.status(200).json(response);

    } catch (err) {
        console.error('Error fetching competition students:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Export Competition Students (CSV)
const exportCompetitionStudents = async (req, res) => {
    try {
        const { id: competitionId } = req.params;
        const { type } = req.query; // 'registered' or 'unregistered'
        const { assigned_sections, department_id } = req.user;

        if (!['registered', 'unregistered'].includes(type)) {
            return res.status(400).json({ error: 'Invalid export type. Must be "registered" or "unregistered".' });
        }

        if (!department_id) {
            return res.status(200).send(''); // Empty CSV
        }

        // 1. Fetch Competition Details (for filename/header)
        const { data: comp, error: compError } = await supabase
            .from('competitions')
            .select('title, venue')
            .eq('id', competitionId)
            .single();

        if (compError) throw compError;

        // 2. Fetch ALL Students in Faculty's Sections (Same logic as getCompetitionStudents)
        let allStudents = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error } = await supabase
                .from('users')
                .select('id, full_name, registration_no, section, email, phone_number')
                .eq('role', 'STUDENT')
                .eq('department_id', department_id)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;
            allStudents = [...allStudents, ...pageData];
            page++;
            if (pageData.length < pageSize) hasMore = false;
        }

        // Filter by assigned sections
        const allowedSections = assigned_sections
            ? assigned_sections.map(s => {
                const parts = s.split('-');
                return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : s.trim().toUpperCase();
            })
            : [];

        const myStudents = allStudents.filter(s => {
            if (allowedSections.length === 0) return true;
            return allowedSections.includes((s.section || '').trim().toUpperCase());
        }).sort((a, b) => a.registration_no.localeCompare(b.registration_no));

        const myStudentIds = myStudents.map(s => s.id);

        if (myStudentIds.length === 0) {
            return res.status(200).send(''); // Empty CSV
        }

        // 3. Fetch Registrations
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('competition_id', competitionId)
            .in('user_id', myStudentIds);

        if (regError) throw regError;

        const regMap = new Map(registrations?.map(r => [r.user_id, r]) || []);

        // 4. Filter Data based on Type
        let exportData = [];

        if (type === 'registered') {
            // All registered students (including shortlisted/winners/etc)
            exportData = myStudents
                .filter(s => regMap.has(s.id) && regMap.get(s.id).verified)
                .map(s => {
                    const reg = regMap.get(s.id);
                    return {
                        ...s,
                        status: 'Registered',
                        verified: reg.verified ? 'Yes' : 'No'
                    };
                });
        } else {
            // Unregistered students
            exportData = myStudents
                .filter(s => !regMap.has(s.id) || !regMap.get(s.id).verified)
                .map(s => ({
                    ...s,
                    status: 'Not Registered',
                    registered_at: '-',
                    verified: '-'
                }));
        }

        // 5. Generate XLSX
        const headers = ['Student Name', 'Register No', 'Section', 'Status'];
        const xlsxData = exportData.map(s => ({
            'Student Name': s.full_name || '',
            'Register No': s.registration_no || '',
            'Section': s.section || '',
            'Status': s.status
        }));

        const buffer = buildXlsxBuffer(xlsxData, headers, 'Students');
        const filename = `${comp.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${type}_students.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(buffer);

    } catch (err) {
        console.error('Error exporting competition students:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getAllCompetitions,
    getCompetitionDetails,
    getCompetitionStudents,
    exportCompetitionStudents
};
