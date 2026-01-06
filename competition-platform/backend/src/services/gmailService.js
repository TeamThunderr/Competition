const { google } = require('googleapis');
const supabase = require('../config/supabaseClient');
const { updateRegistrationFromGmail } = require('./gmailToRegistration.service');

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

// Keywords per status
const KEYWORDS = {
    REGISTERED: ['registration successful', 'registration confirmed', 'registration is confirmed', 'thank you for registering', 'you have registered', 'successfully registered', 'welcome', 'ticket', 'order'],
    QUALIFIED: ['shortlisted', 'qualified', 'selected', 'congratulations', 'moved to next round', 'finalist', 'round 2'],
    REJECTED: ['not selected', 'unfortunately', 'regret to inform', 'did not qualify', 'unsuccessful', 'rejected', 'disqualified', 'not registered', 'not qualified', 'not shortlisted', 'not finalist', 'unable to move', 'better luck'],
    ACTION_REQUIRED: ['submit', 'deadline', 'round 1', 'round 2', 'presentation', 'ppt submission', 'interview', 'evaluation', 'action required', 'complete your profile', 'verify email', 'pending']
};

/**
 * Detect hackathon status based on keywords
 */
const detectHackathonStatus = (text) => {
    const lowerText = text.toLowerCase();

    // Check Qualified (Highest Priority)
    if (KEYWORDS.QUALIFIED.some(k => lowerText.includes(k))) {
        return { status: 'QUALIFIED', confidence: 90 };
    }

    // Check Rejected (Priority over Registered to catch "not registered")
    if (KEYWORDS.REJECTED.some(k => lowerText.includes(k))) {
        return { status: 'REJECTED', confidence: 70 };
    }

    // Check Registered
    if (KEYWORDS.REGISTERED.some(k => lowerText.includes(k))) {
        return { status: 'REGISTERED', confidence: 80 };
    }

    // Check Action Required
    if (KEYWORDS.ACTION_REQUIRED.some(k => lowerText.includes(k))) {
        return { status: 'ACTION_REQUIRED', confidence: 60 };
    }

    return null;
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
 * Extract Hackathon Name from Subject
 */
const extractHackathonName = (subject, sender) => {
    // Strategy 1: Split by separators
    const separators = ['|', '–', '-', ':', '[', ']']; // Added brackets for [Event Name]
    for (const sep of separators) {
        if (subject.includes(sep)) {
            const parts = subject.split(sep);
            // Usually the longest part or the first part is the name
            // Let's take the first part that looks like a name (length > 3)
            const name = parts.find(p => p.trim().length > 3);
            if (name) return name.trim();
        }
    }

    // Strategy 2: Clean common prefixes
    let finalName = subject;

    // Clean common prefixes (Case Insensitive Check)
    const prefixes = [
        'Welcome to ',
        'Registration Confirmed: ',
        'You are registered for ',
        'Registered successfully for ' // Added for Unstop
    ];

    for (const p of prefixes) {
        if (finalName.toLowerCase().startsWith(p.toLowerCase())) {
            finalName = finalName.substring(p.length);
        }
    }

    // Clean: Remove emojis and non-standard chars from start
    finalName = finalName.replace(/^[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]\s*/gu, '');

    // Clean: Remove trailing punctuation like '!' or '.'
    finalName = finalName.replace(/[!.]+$/, '');

    // If name is just "Congratulations" or similar, try next part if available or using subject
    if (['congratulations', 'reminder', 'update'].includes(finalName.toLowerCase())) {
        return subject;
    }

    return finalName.trim();
};

/**
 * calculateMatchScore
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
    else if (score >= 20) confidence_level = 'LOW_PASS'; // New level for relaxed sync

    return {
        score,
        breakdown,
        matched_signals,
        confidence_level,
        detected_status: detectedStatus
    };
};

/**
 * Helper to parse email data from Gmail API response
 */
const parseEmail = (emailData) => {
    const headers = emailData.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    const snippet = emailData.snippet || '';

    return {
        id: emailData.id,
        subject,
        from,
        date,
        snippet,
        sender: from // Alias for consistency
    };
};

/**
 * Fetch recent emails from Gmail API using the user's provider token
 */
const fetchRecentEmails = async (accessToken, days = 90) => {
    try {
        console.log("fetchRecentEmails called with token:", accessToken ? "Present" : "Missing");
        if (!accessToken) throw new Error("AccessToken is missing");

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth });

        // Calculate date query (after: YYYY/MM/DD)
        const date = new Date();
        date.setDate(date.getDate() - days);
        const dateQuery = `after:${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

        // List messages 
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: dateQuery,
            maxResults: 300 // Increased limit to catch older emails
        });

        const messages = response.data.messages || [];
        const results = [];

        console.log(`Found ${messages.length} emails. Processing...`);

        // Fetch details for each message
        for (const msg of messages) {
            try {
                const msgDetails = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id
                });
                results.push(parseEmail(msgDetails.data));
            } catch (err) {
                console.error(`Failed to fetch message ${msg.id}`, err);
            }
        }

        return results;
    } catch (error) {
        console.error('Gmail API Error Details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to fetch emails from Gmail: ${error.message}`);
    }
};

/**
 * Main Logic to Process and Save
 */
const processAndSaveEmails = async (accessToken, userId, competitionId) => {
    const emails = await fetchRecentEmails(accessToken);
    const detectedList = [];

    for (const email of emails) {
        const combinedText = `${email.subject} ${email.snippet}`;
        const detection = detectHackathonStatus(combinedText);

        if (detection) {
            const hackathonName = extractHackathonName(email.subject, email.sender);

            const record = {
                user_id: userId,
                hackathon_name: hackathonName,
                platform: email.sender.toLowerCase().includes('devfolio') ? 'Devfolio' :
                    email.sender.toLowerCase().includes('unstop') ? 'Unstop' : 'Other',
                status: detection.status,
                source: 'GMAIL',
                email_date: email.date,
                confidence_score: detection.confidence,
                snippet: email.snippet
            };

            detectedList.push(record);

            // CRITICAL: Update Registrations Table if competitionId is provided
            if (competitionId) {
                await updateRegistrationFromGmail({
                    userId,
                    competitionId,
                    detectedStatus: detection.status
                });
            }
        }
    }

    // Bulk Insert
    if (detectedList.length > 0) {
        const { error } = await supabase
            .from('detected_hackathons')
            .insert(detectedList);

        if (error) console.error('Error inserting detected hackathons:', error);
    }

    return detectedList;
};

/**
 * Targeted verification for a specific competition
 * Scans only for the specific competition title/organizer
 */
const verifySpecificRegistration = async (accessToken, hackathonName) => {
    try {
        const match = await syncStudentCompetition(accessToken, { title: hackathonName }, null, null);
        return match.suggested_status === 'REGISTERED' || match.suggested_status === 'QUALIFIED';
    } catch (e) {
        console.error("Verification error:", e);
        return false;
    }
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
        if (!accessToken) throw new Error("AccessToken is missing");

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth });

        // 1. Construct Broad Query
        // Strategy: "TitleTokens" OR "Platform"
        const titleTokens = tokenize(competition.title);
        const mainTerms = titleTokens.slice(0, 2).join(' '); // e.g., "techsprint 2026"

        let queryString = `"${mainTerms}"`;

        if (competition.platform) {
            queryString = `(${queryString}) OR "${competition.platform}"`;
        }

        console.log(`[GmailDebug] Query: [${queryString}] for Comp: ${competition.title}`);

        // Handling Dates
        let dateQuery = '';
        if (lastSyncedAt) {
            const date = new Date(lastSyncedAt);
            if (!isNaN(date)) {
                dateQuery = `after:${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            }
        }

        // Fallback to 90 days if no dateQuery
        if (!dateQuery) {
            const date = new Date();
            date.setDate(date.getDate() - 90);
            dateQuery = `after:${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        }

        // Add date query to main query
        queryString = `${queryString} ${dateQuery}`;

        // 2. Fetch Candidates
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: queryString,
            maxResults: 15 // Check top 15 candidates
        });

        const messages = response.data.messages || [];
        console.log(`[GmailDebug] Messages found: ${messages.length}`);

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

            if (analysis.score > bestScore) {
                bestScore = analysis.score;
                bestMatch = {
                    ...analysis,
                    gmail_message_id: msg.id,
                    matched_keyword: analysis.detected_status
                };
            }
        }

        if (bestMatch) {
            console.log(`[GmailDebug] Best Match for ${competition.title}: Score ${bestScore} | Breakdown: ${bestMatch.breakdown.join(', ')}`);
        }

        // 4. Final Decision
        if (!bestMatch) return { suggested_status: 'NOT_FOUND', confidence: 0 };

        // Thresholds
        // RELAXED: Lowered from 40 to 20 to catch partial matches (e.g. Platform + Date)
        if (bestScore < 20) {
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
    syncStudentCompetition,
    processAndSaveEmails,
    fetchRecentEmails
};
