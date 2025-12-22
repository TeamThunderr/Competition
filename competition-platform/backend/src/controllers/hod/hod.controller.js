// File Name: hod.controller.js
// Purpose: Handle HOD operations
// Written for beginner developers

const hodService = require('../../services/hod/hod.service');

// API: POST /api/hod/od/approve
exports.processODRequest = async (req, res) => {
    try {
        const hodId = req.user.id;
        const { odRequestId, status } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: "Status must be APPROVED or REJECTED" });
        }

        const result = await hodService.approveODRequest(hodId, odRequestId, status);

        res.status(200).json({
            message: `OD Request ${status}`,
            data: result
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
