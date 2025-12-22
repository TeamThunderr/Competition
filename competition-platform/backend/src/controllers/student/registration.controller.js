// File Name: registration.controller.js
// Purpose: Handle manual registration uploads
// Written for beginner developers

const registrationService = require('../../services/student/registration.service');

// API: POST /api/student/register/manual
exports.uploadManualProof = async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware
        const { competitionId, proofUrl } = req.body;

        if (!competitionId || !proofUrl) {
            return res.status(400).json({ message: "Competition ID and Proof URL are required" });
        }

        const result = await registrationService.uploadScreenshot(userId, competitionId, proofUrl);

        res.status(201).json({
            message: "Proof uploaded! Waiting for Faculty verification.",
            data: result
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
