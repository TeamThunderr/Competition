const { google } = require('googleapis');

// Scopes required for the application
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly'
];

/**
 * REF: Faculty-Driven Gmail Sync Service (Rule-Based Matching Engine)
 * 
 * Target Accuracy: ~90% without ML.
 * Signals: Platform, Date, Tokens, Organizer.
 */

const KEYWORDS = {
    REGISTERED: ['registered', 'confirmation', 'successfully', 'welcome', 'ticket', 'order'],
    SHORTLISTED: ['shortlisted', 'qualified', 'selected', 'round 2', 'finalist', 'congratulations'],
    REJECTED: ['regret', 'unfortunately', 'unable to move', 'better luck', 'not selected'],
    ACTION_REQUIRED: ['action required', 'complete your profile', 'verify email', 'pending']
};

/**
 * Tokenize string: lowercase, remove stopwords, split
 */
const tokenize = (text) => {
    if (!text || typeof text !== 'string') return [];
    const stopwords = ['the', 'of', 'for', 'in', 'and', 'at', 'to', 'a', 'an', 'competition', 'hackathon', 'event', 'challenge'];
    return text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/[\s-]+/)
        .filter(t => t.length > 2 && !stopwords.includes(t));
};

/**
 * Calculate Match Score
 * @param {Object} emailMetadata { subject, snippet, from, date }
 * @param {Object} competition { title, platform, organizer, registration_start, registration_end }
 * @returns {Object} { score, breakdown, matched_signals, confidence_level }
 */
const calculateMatchScore = (email, competition) => {
    let score = 0;
    const breakdown = [];
    const matched_signals = { platform: false, date: false, tokens: [], organizer: false };

    const emailDate = new Date(email.date);
    const subjectLower = (email.subject || '').toLowerCase();
    const fromLower = (email.from || '').toLowerCase();
    const textToCheck = `${subjectLower} ${email.snippet || ''}`.toLowerCase();

    // 1. PLATFORM MATCH (+40)
    // High confidence if email comes from the platform domain or mentions it explicitly in sender
    if (competition.platform) {
        const platform = competition.platform.toLowerCase();
        if (fromLower.includes(platform) || (fromLower.includes('no-reply') && textToCheck.includes(platform))) {
            score += 40;
            breakdown.push('Platform Match (+40)');
            matched_signals.platform = true;
        }
    }

    // 2. DATE WINDOW MATCH (+25)
    // Reg Start -> Reg End + 7 days
    if (competition.registration_start && competition.registration_deadline) {
        const start = new Date(competition.registration_start);
        const end = new Date(competition.registration_deadline);
        end.setDate(end.getDate() + 7); // +7 days buffer

        if (emailDate >= start && emailDate <= end) {
            score += 25;
            breakdown.push('Date Window (+25)');
            matched_signals.date = true;
        }
    }

    // 3. TOKEN MATCHING (Max 20)
    // 5 pts per token match with title
    const titleTokens = tokenize(competition.title);
    let tokenScore = 0;
    const foundTokens = [];

    titleTokens.forEach(token => {
        if (textToCheck.includes(token)) {
            tokenScore += 5;
            foundTokens.push(token);
        }
    });

    // Cap at 20
    if (tokenScore > 20) tokenScore = 20;
    if (tokenScore > 0) {
        score += tokenScore;
        breakdown.push(`Tokens: ${foundTokens.join(', ')} (+${tokenScore})`);
        matched_signals.tokens = foundTokens;
    }

    // 4. ORGANIZER MATCH (+20)
    if (competition.organizer) {
        const organizer = competition.organizer.toLowerCase();
        if (textToCheck.includes(organizer) || fromLower.includes(organizer)) {
            score += 20;
            breakdown.push('Organizer Match (+20)');
            matched_signals.organizer = true;
        }
    }

    // 5. STATUS KEYWORD (+5)
    let detectedStatus = null;
    for (const status in KEYWORDS) {
        if (KEYWORDS[status].some(kw => textToCheck.includes(kw))) {
            detectedStatus = status;
            score += 5;
            breakdown.push(`Status Key: ${status} (+5)`);
            break;
        }
    }

    // DECISION
    let confidence_level = 'LOW';
    if (score >= 60) confidence_level = 'HIGH';
    else if (score >= 40) confidence_level = 'MEDIUM';

    return {
        score,
        breakdown,
        matched_signals,
        confidence_level,
        detected_status: detectedStatus
    };
};

/**
 * Main Entry Point: Syncs specific competition for a specific student.
 * 
 * @param {string} accessToken - Student's valid OAuth Access Token
 * @param {Object} competition - Full Competition Object
 * @param {string} [lastSyncedAt] - ISO Date string to filter "after:..."
 * @returns {Promise<Object>} Result object
 */
const syncStudentCompetition = async (accessToken, competition, lastSyncedAt = null) => {
    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth });

        // 1. Construct Broad Query (Candidates)
        // Use tokens to find potential emails. 
        // e.g. "Space Hackathon" -> "Space" OR "Hackathon" (too broad?)
        // Better: "Space Hackathon" (Phrase) OR (Title AND Platform)

        const titleTokens = tokenize(competition.title);
        // Take top 2 significant tokens if likely unique, or just the whole specific phrase if short
        // For safety, let's query the specific phrase AND platform if available.

        let queryParts = [];

        const cleanTitle = competition.title.replace(/[^a-zA-Z0-9 ]/g, '').trim();
        queryParts.push(`"${cleanTitle}"`);

        if (competition.platform) {
            queryParts.push(competition.platform);
        }

        if (lastSyncedAt) {
            const afterProp = Math.floor(new Date(lastSyncedAt).getTime() / 1000);
            if (!isNaN(afterProp)) queryParts.push(`after:${afterProp}`);
        }

        const queryString = queryParts.join(' ');

        // 2. Fetch Candidates
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: queryString,
            maxResults: 15 // Check top 15 candidates
        });

        const messages = response.data.messages || [];
        if (messages.length === 0) {
            return { suggested_status: 'NOT_FOUND', confidence: 0 };
        }

        // 3. Score Candidates
        let bestMatch = null;
        let bestScore = -1;

        for (const msg of messages) {
            const details = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From', 'Date']
            });

            const emailData = {
                id: msg.id,
                snippet: details.data.snippet,
                subject: details.data.payload.headers.find(h => h.name === 'Subject')?.value,
                from: details.data.payload.headers.find(h => h.name === 'From')?.value,
                date: details.data.payload.headers.find(h => h.name === 'Date')?.value
            };

            const analysis = calculateMatchScore(emailData, competition);

            console.log(`[GmailRefactor] Msg ${msg.id} Score: ${analysis.score} (${analysis.breakdown.join(', ')})`);

            if (analysis.score > bestScore) {
                bestScore = analysis.score;
                bestMatch = {
                    ...analysis,
                    gmail_message_id: msg.id,
                    matched_keyword: analysis.detected_status
                };
            }
        }

        // 4. Final Decision
        if (!bestMatch) return { suggested_status: 'NOT_FOUND', confidence: 0 };

        // Thresholds
        if (bestScore < 40) {
            return {
                suggested_status: 'NOT_FOUND',
                confidence: bestScore,
                remarks: `Ignored Low Score: ${bestScore} (${bestMatch.breakdown.join(', ')})`
            };
        }

        // Return Match
        return {
            suggested_status: bestMatch.detected_status || (bestScore >= 60 ? 'REGISTERED' : 'PENDING'), // Default to PENDING/REGISTERED if status key missing but context is strong
            confidence: bestScore, // Use Score as confidence
            gmail_message_id: bestMatch.gmail_message_id,
            matched_keyword: bestMatch.matched_keyword,
            detected_at: new Date().toISOString(),
            source: 'AUTO_GMAIL',
            confidence_level: bestMatch.confidence_level,
            match_breakdown: bestMatch.breakdown
        };

    } catch (error) {
        console.error('Error in Matching Engine:', error.message);
        throw error;
    }
};

module.exports = {
    syncStudentCompetition
};
