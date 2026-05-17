const { sendResponse, sendError } = require('../../utils/responseHelper');
const statsService = require('../../services/admin/stats.service');

const getDepartmentStats = async (req, res) => {
    try {
        console.log('[StatsController] Received stats request - Applying active filter');
        const stats = await statsService.getDepartmentStats();

        sendResponse(res, 200, stats, 'Fetched department stats');

    } catch (err) {
        console.error('[StatsController] Stats Error:', err);
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../../../server_error.log');
        const errorLog = `[${new Date().toISOString()}] ${err.stack || err.message}\n`;
        try {
            fs.appendFileSync(logPath, errorLog);
        } catch (fileErr) {
            console.error('Failed to write to error log:', fileErr);
        }

        sendError(res, 500, err.message);
    }
};

const getCompetitionStats = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[StatsController] Fetching stats for ID: ${id}`);
        const stats = await statsService.getCompetitionStats(id);
        console.log(`[StatsController] Stats fetched successfully`);
        res.status(200).json(stats);
    } catch (err) {
        console.error('[StatsController] Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getDepartmentStats,
    getCompetitionStats
};
