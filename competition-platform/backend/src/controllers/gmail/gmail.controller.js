const gmailService = require('../../services/gmailService');

const scanInbox = async (req, res) => {
    try {
        const { provider_token } = req.body;
        // In a real app we would get user ID from session/middleware.
        // Here we might need to look it up or trust the frontend to send the email/user.
        // Assuming the authMiddleware populates req.user

        if (!provider_token) {
            return res.status(400).json({ error: 'Missing Google Provider Token' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log(`Starting Gmail Scan for user ${req.user.email}...`);

        const results = await gmailService.processAndSaveEmails(provider_token, req.user.id);

        return res.status(200).json({
            message: 'Scan complete',
            detectedCount: results.length,
            results
        });

    } catch (error) {
        console.error('Gmail Scan Controller Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    scanInbox
};
