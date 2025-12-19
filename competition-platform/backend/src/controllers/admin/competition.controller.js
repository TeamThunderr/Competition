const adminService = require("../../services/admin/competition.service");

// ✅ Manual competition add
exports.addCompetition = async (req, res) => {
    try {
        await adminService.insertManualCompetition(req.body);
        res.status(201).json({
            success: true,
            message: "Competition added successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ✅ Excel / CSV upload
exports.uploadCompetitions = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "File is required" });
        }

        // req.file will be parsed later (CSV/Excel logic)
        await adminService.insertBulkCompetitions([]);

        res.status(200).json({
            success: true,
            message: "Competitions uploaded successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
