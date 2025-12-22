const statsService = require('../../services/admin/stats.service');

const getDepartmentStats = async (req, res) => {
    try {
        console.log('[StatsController] Received stats request');
        const stats = await statsService.getDepartmentStats();

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (err) {
        console.error('[StatsController] Error:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

module.exports = {
    getDepartmentStats
};
