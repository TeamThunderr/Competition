// File Name: faculty.service.js
// Purpose: DB operations for faculty
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const getStudents = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, registration_no, role, department_id')
            .eq('role', 'STUDENT');

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error in faculty.service.getStudents:', err.message);
        return [];
    }
};

module.exports = { getStudents };
