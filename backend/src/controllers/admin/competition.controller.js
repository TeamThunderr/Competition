const adminService = require("../../services/admin/competition.service");
const xlsx = require("xlsx");

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
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    try {
        await adminService.insertBulkCompetitions(rows);
        res.status(200).json({
            success: true,
            message: "Competitions uploaded successfully"
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to process upload"
        });
    }
};
// ✅ Update competition
exports.editCompetition = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await adminService.updateCompetition(id, req.body);
        res.status(200).json({
            success: true,
            message: "Competition updated successfully",
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ✅ Delete competition
exports.deleteCompetition = async (req, res) => {
    try {
        const { id } = req.params;
        await adminService.deleteCompetition(id);
        res.status(200).json({
            success: true,
            message: "Competition deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
