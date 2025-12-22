// File Name: faculty.controller.js
// Purpose: Handle Faculty operations (Verification)
// Written for beginner developers

const verificationService = require('../../services/faculty/verification.service');

// API: POST /api/faculty/verify
exports.verifyStudentRegistration = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { registrationId, status } = req.body; // status: 'APPROVED' or 'REJECTED'

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: "Status must be APPROVED or REJECTED" });
        }

        const result = await verificationService.verifyRegistration(facultyId, registrationId, status);

        res.status(200).json({
            message: `Registration marked as ${status}`,
            data: result
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
