const supabase = require('../../config/supabaseClient');

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
                departments!inner (
                    name
                )
            `)
            .eq('role', 'STUDENT');

        // Filter by Department Name if provided
        if (dept) {
            query = query.eq('departments.name', dept);
        }

        // Filter by Section if provided
        if (section) {
            query = query.eq('section', section);
        }

        // Search by Name or Roll Number
        if (search) {
            // content-type: application/json
            // Using 'ilike' for case-insensitive partial match on both fields
            query = query.or(`full_name.ilike.%${search}%,registration_no.ilike.%${search}%`);
        }

        // Default constraints (ordering)
        query = query
            .order('full_name', { ascending: true }) // Order by name usually better for search
            .limit(50); // Limit results for performance

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
};

// Fetch Single Student Details
exports.getStudentDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                departments ( name )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Fetch user stats
        const { count: participatedCount, error: participatedError } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id);

        const { count: wonCount, error: wonError } = await supabase
            .from('competition_status')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id)
            .eq('is_winner', true);

        if (participatedError) console.error("Error fetching participation count:", participatedError);
        if (wonError) console.error("Error fetching won count:", wonError);

        const enrichedData = {
            ...data,
            stats: {
                participated: participatedCount || 0,
                won: wonCount || 0
            }
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
