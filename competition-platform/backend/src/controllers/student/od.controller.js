// File Name: od.controller.js
// Purpose: Handle Student OD Requests
// Written for beginner developers

const odService = require('../../services/student/od.service');

// API: POST /api/student/od/request
exports.createODRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { competitionId, reason } = req.body;

        if (!competitionId || !reason) {
            return res.status(400).json({ message: "Competition ID and Reason are required" });
        }

        const result = await odService.requestOD(userId, competitionId, reason);

        res.status(201).json({
            message: "OD Request Submitted. Waiting for HOD approval.",
            data: result
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
