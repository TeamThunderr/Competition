const { google } = require('googleapis');
const supabase = require('../../config/supabaseClient');

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly'
];

/**
 * Helper to get a configured OAuth2Client
 */
const getOAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID, // from existing setup or .env
        process.env.GOOGLE_CLIENT_SECRET, // from existing setup or .env
        process.env.GOOGLE_REDIRECT_URI
    );
};

/**
 * 1. Generate Auth URL
 */
const getAuthUrl = (req, res) => {
    try {
        const oauth2Client = getOAuthClient();
        
        // Pass the user ID in the state so we know who they are on callback
        const state = Buffer.from(JSON.stringify({ userId: req.userId })).toString('base64');

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // Forces new refresh token to be issued
            scope: SCOPES,
            state: state
        });

        res.status(200).json({ authUrl });
    } catch (error) {
        console.error('[GmailOAuth] Error generating auth URL:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
};

/**
 * 2. Handle Google Callback
 */
const handleOAuthCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            console.error('[GmailOAuth] Google returned error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/student/settings?gmail=error`);
        }

        if (!code) {
            return res.status(400).send('No authorization code provided');
        }

        // Decode state to get user ID
        let userId;
        try {
            const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
            userId = decodedState.userId;
        } catch (err) {
            console.error('[GmailOAuth] Invalid state parameter');
            return res.status(400).send('Invalid state parameter');
        }

        if (!userId) {
            return res.status(400).send('Missing user ID in state');
        }

        const oauth2Client = getOAuthClient();
        
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens.refresh_token) {
            return res.status(400).send("No refresh token received — revoke app access at myaccount.google.com/permissions and try again");
        }

        // Save refresh token to DB
        const { error: dbError } = await supabase
            .from('users')
            .update({ google_refresh_token: tokens.refresh_token })
            .eq('id', userId);

        if (dbError) {
            console.error('[GmailOAuth] Error saving refresh token to DB:', dbError);
            return res.status(500).send('Database error saving token');
        }

        // Redirect back to frontend
        res.redirect(`${process.env.FRONTEND_URL}/student/settings?gmail=connected`);

    } catch (err) {
        console.error('[GmailOAuth] Callback error:', err);
        res.redirect(`${process.env.FRONTEND_URL}/student/settings?gmail=error`);
    }
};

/**
 * 3. Revoke Access
 */
const revokeGmailAccess = async (req, res) => {
    try {
        const userId = req.userId;

        // 1. Fetch current token
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('google_refresh_token')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const refreshToken = user.google_refresh_token;

        // 2. Revoke from Google
        if (refreshToken) {
            try {
                const oauth2Client = getOAuthClient();
                await oauth2Client.revokeToken(refreshToken);
            } catch (revokeError) {
                console.warn(`[GmailOAuth] Failed to revoke token from Google (may be expired):`, revokeError.message);
                // Continue to clear DB anyway
            }
        }

        // 3. Clear from DB
        const { error: clearError } = await supabase
            .from('users')
            .update({ google_refresh_token: null })
            .eq('id', userId);

        if (clearError) {
            throw clearError;
        }

        res.status(200).json({ message: "Gmail access revoked" });

    } catch (err) {
        console.error('[GmailOAuth] Revoke error:', err);
        res.status(500).json({ error: 'Failed to revoke Gmail access' });
    }
};

module.exports = {
    getAuthUrl,
    handleOAuthCallback,
    revokeGmailAccess
};
