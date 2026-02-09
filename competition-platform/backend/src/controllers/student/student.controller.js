// File Name: student.controller.js
// Purpose: Student search and validation controller
// Written for beginner developers

const studentService = require('../../services/student/student.service');

/**
 * Search for students by registration number or name
 * GET /api/students/search?query=<search_term>&competition_id=<optional_id>
 */
const searchStudents = async (req, res) => {
    try {
        const { query, competition_id } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const students = await studentService.searchStudents(query, competition_id);

        res.status(200).json(students);
    } catch (err) {
        console.error('[Student Controller] Search error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Validate a teammate for a competition
 * POST /api/students/validate-teammate
 * Body: { reg_no, name, competition_id }
 */
const validateTeammate = async (req, res) => {
    try {
        const { reg_no, name, competition_id } = req.body;

        if (!reg_no || !name || !competition_id) {
            return res.status(400).json({ error: 'Missing required fields: reg_no, name, competition_id' });
        }

        const result = await studentService.validateTeammate(reg_no, name, competition_id);

        if (result.valid) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        console.error('[Student Controller] Validate teammate error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    searchStudents,
    validateTeammate
};
