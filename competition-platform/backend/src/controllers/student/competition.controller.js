// File Name: competition.controller.js
// Purpose: Handle Student Competition Requests
// Written for beginner developers

const competitionService = require('../../services/student/competition.service');

// Controller: Get Competitions
// Routes calling this: GET /api/student/competitions
exports.getCompetitions = async (req, res) => {
    try {
        // Call the service to get data
        const competitions = await competitionService.getAllCompetitions();
        
        // Send success response
        res.status(200).json(competitions);
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: error.message });
    }
};
