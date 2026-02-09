// File Name: student.service.js
// Purpose: Student search and validation services
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

/**
 * Search for students by registration number or name
 * Optionally filter by competition qualification status
 */
const searchStudents = async (query, competitionId = null) => {
    try {
        // Build the base query
        let dbQuery = supabase
            .from('users')
            .select('id, full_name, registration_no, email, department_id, departments(name)')
            .eq('role', 'STUDENT');

        // Search by registration number (case-insensitive, partial match)
        if (query) {
            // Try to match registration number or name
            dbQuery = dbQuery.or(`registration_no.ilike.%${query}%,full_name.ilike.%${query}%`);
        }

        dbQuery = dbQuery.limit(10); // Limit results for autocomplete

        const { data: students, error } = await dbQuery;

        if (error) throw error;

        // If competition_id provided, filter by qualification status
        if (competitionId && students && students.length > 0) {
            const studentIds = students.map(s => s.id);

            const { data: registrations, error: regError } = await supabase
                .from('registrations')
                .select('user_id, status, qualification_verified')
                .eq('competition_id', competitionId)
                .in('user_id', studentIds);

            if (regError) throw regError;

            // Create a map of user_id to registration status
            const regMap = {};
            if (registrations) {
                registrations.forEach(reg => {
                    regMap[reg.user_id] = {
                        status: reg.status,
                        qualification_verified: reg.qualification_verified
                    };
                });
            }

            // Enrich students with qualification info
            return students.map(student => ({
                ...student,
                is_qualified: regMap[student.id]?.status === 'Qualified',
                is_verified: regMap[student.id]?.qualification_verified === true,
                department: student.departments?.name || null
            }));
        }

        return students.map(student => ({
            ...student,
            department: student.departments?.name || null
        }));

    } catch (err) {
        console.error('[Student Service] Search error:', err);
        throw err;
    }
};

/**
 * Validate if a teammate is eligible for the competition
 * Checks: 1) Student exists, 2) Name matches, 3) Qualified, 4) Verified
 */
const validateTeammate = async (regNo, name, competitionId) => {
    try {
        // 1. Find student by registration number
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('id, full_name, registration_no, email')
            .eq('registration_no', regNo)
            .eq('role', 'STUDENT')
            .maybeSingle();

        if (studentError) throw studentError;

        if (!student) {
            return {
                valid: false,
                error: 'Student not found with this registration number'
            };
        }

        // 2. Check if name matches (case-insensitive)
        if (student.full_name.toLowerCase().trim() !== name.toLowerCase().trim()) {
            return {
                valid: false,
                error: `Name mismatch. Expected: ${student.full_name}`
            };
        }

        // 3. Check registration for competition
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select('status, qualification_verified')
            .eq('user_id', student.id)
            .eq('competition_id', competitionId)
            .maybeSingle();

        if (regError) throw regError;

        if (!registration) {
            return {
                valid: false,
                error: 'Student is not registered for this competition'
            };
        }

        // 4. Check if qualified
        if (registration.status !== 'Qualified') {
            return {
                valid: false,
                error: `Student is not qualified for this competition (Status: ${registration.status})`
            };
        }

        // 5. Check if verified by faculty
        if (registration.qualification_verified !== true) {
            return {
                valid: false,
                error: 'Student\'s qualification has not been verified by faculty yet'
            };
        }

        // All checks passed
        return {
            valid: true,
            student: {
                id: student.id,
                full_name: student.full_name,
                registration_no: student.registration_no,
                email: student.email
            }
        };

    } catch (err) {
        console.error('[Student Service] Validate teammate error:', err);
        throw err;
    }
};

module.exports = {
    searchStudents,
    validateTeammate
};
