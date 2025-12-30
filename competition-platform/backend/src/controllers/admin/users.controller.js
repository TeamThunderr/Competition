const supabase = require('../../config/supabaseClient');

// Fetch Students filtered by Department and Section
exports.getStudents = async (req, res) => {
    try {
        const { dept, section } = req.query;

        let query = supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                registration_no,
                section,
                year,
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

        // Default constraints (ordering)
        query = query
            .order('name', { foreignTable: 'departments', ascending: true })
            .order('section', { ascending: true });

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
