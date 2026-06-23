const supabase = require('../../config/supabaseClient');
const { applyPagination, paginatedResponse } = require('../../utils/paginate.util');

// Fetch Students filtered by Department, Section, and Search Term
exports.getStudents = async (req, res) => {
    try {
        const { dept, section, search } = req.query;

        let query = supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                registration_no,
                section,
                admission_year,
                cgpa,
                attendance,
                departments (
                    name
                )
            `, { count: 'exact' })
            .eq('role', 'STUDENT');

        // Filter by Department Name if provided
        if (dept) {
            query = query.eq('departments.name', dept);
        }

        // Filter by Section if provided
        if (section) {
            query = query.eq('section', section);
        }

        // Search by Name or Roll Number or Email
        if (search) {
            // Using 'ilike' for case-insensitive partial match
            const term = `%${search}%`;
            query = query.or(`full_name.ilike.${term},registration_no.ilike.${term},email.ilike.${term}`);
        }

        // Apply API-level pagination (from paginate middleware; defaults to page=1, limit=50)
        const pagination = req.pagination || { page: 1, limit: 50, offset: 0 };
        query = query.order('full_name', { ascending: true });

        const { data, error, count } = await applyPagination(query, pagination);

        if (error) {
            throw error;
        }

        res.status(200).json({ success: true, ...paginatedResponse(data, pagination, count) });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message || error });
    }
};

// Fetch Single Student Details
exports.getStudentDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Student Basic Info
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('id, full_name, registration_no, email, phone_number, department_id, section, cgpa, departments(name)')
            .eq('id', id)
            .single();

        if (studentError || !student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 2. Fetch Registrations & Competitions
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
                id,
                registered_at,
                verified,
                competitions (
                    id,
                    title,
                    platform,
                    registration_deadline
                )
            `)
            .eq('user_id', id);

        if (regError) throw regError;

        // 3. Fetch Status (Qualified/Won)
        const { data: statuses, error: statusError } = await supabase
            .from('competition_status')
            .select('*')
            .eq('user_id', id);

        if (statusError) throw statusError;

        // 4. Aggregate Data & Calculate Stats
        const competitionDetails = registrations.map(reg => {
            const statusEntry = statuses?.find(s => s.competition_id === reg.competitions.id);

            let status = 'Registered';
            const isVerified = reg.verified;

            if (statusEntry?.is_shortlisted) status = 'Qualified';
            if (statusEntry?.is_winner) status = 'Won';

            return {
                id: reg.competitions.id,
                competitionName: reg.competitions.title,
                platform: reg.competitions.platform || 'N/A',
                regType: 'Individual',
                status: status,
                verificationStatus: isVerified ? 'Verified' : 'Pending',
                registeredAt: reg.registered_at
            };
        });

        // Calculate Batch (Heuristic based on Regno)
        let batchLabel = 'N/A';
        if (student.registration_no) {
            const regNo = student.registration_no;
            let yearShort = null;
            const prefix = regNo.substring(0, 2);
            const mid = regNo.length >= 6 ? regNo.substring(4, 6) : null;

            if (parseInt(prefix) >= 15 && parseInt(prefix) <= 40) {
                yearShort = prefix;
            } else if (mid && parseInt(mid) >= 15 && parseInt(mid) <= 40) {
                yearShort = mid;
            }

            if (yearShort) {
                const startYear = 2000 + parseInt(yearShort, 10);
                const endYear = startYear + 4;
                batchLabel = `${startYear}-${endYear}`;
            }
        }

        // 5. Fetch Class Advisor
        let classAdvisorName = 'Not Assigned';
        if (student.section && student.departments?.name) {
            // Construct the search tag: e.g., "CSE-A"
            const sectionTag = `${student.departments.name}-${student.section}`;

            const { data: faculty } = await supabase
                .from('users')
                .select('full_name')
                .eq('role', 'FACULTY')
                .eq('department_id', student.department_id) // Scope to student's dept
                .contains('assigned_sections', [sectionTag]) // Look for ["CSE-A"]
                .maybeSingle();

            if (faculty) {
                classAdvisorName = faculty.full_name;
            } else {
                // Fallback: Try just the section letter in case some faculty are assigned just "A"
                const { data: fallbackFaculty } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('role', 'FACULTY')
                    .eq('department_id', student.department_id) // Scope to student's dept
                    .contains('assigned_sections', [student.section])
                    .maybeSingle();

                if (fallbackFaculty) classAdvisorName = fallbackFaculty.full_name;
            }
        }

        // Stats
        const stats = {
            registered: registrations.length,
            qualified: statuses?.filter(s => s.is_shortlisted).length || 0,
            won: statuses?.filter(s => s.is_winner).length || 0,
        };

        const enrichedData = {
            profile: {
                id: student.id,
                name: student.full_name,
                rollNo: student.registration_no,
                email: student.email,
                department: student.departments?.name || 'N/A',
                section: student.section,
                batch: batchLabel,
                cgpa: student.cgpa || 'N/A',
                phoneNumber: student.phone_number || 'N/A',
                classAdvisor: classAdvisorName
            },
            stats,
            competitions: competitionDetails
        };

        res.status(200).json({ success: true, data: enrichedData });

    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student details' });
    }
};

// Fetch Faculty filtered by Assigned Section
exports.getFaculty = async (req, res) => {
    try {
        const { section } = req.query;

        let query = supabase
            .from('users')
            .select(`
                id,
                full_name,
                assigned_sections,
                departments (
                    name
                )
            `)
            .eq('role', 'FACULTY');

        // Filter by Assigned Section if provided
        if (section) {
            query = query.contains('assigned_sections', [section]);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching faculty:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch faculty' });
    }
};
