const { google } = require('googleapis');
const supabase = require('../../config/supabaseClient');

// Scopes required for the application
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly'
];

/**
 * ------------------------------------------------------------------
 * CONFIGURATION & SIGNAL DEFINITIONS
 * ------------------------------------------------------------------
 */

const INTENT_EXACT = ['registered', 'shortlisted', 'selected', 'confirmed', 'you’re in', 'congratulations', 'ticket', 'Ready To Hack?'];
const INTENT_STRONG = ['successfully applied', 'application received', 'submission received', 'registration details', 'payment received', 'welcome to'];
const INTENT_WEAK = ['reference id', 'thank you', 'complete your', 'dashboard', 'next steps', 'updates', 'reminder'];

const KNOWN_PLATFORMS = [
    'devfolio', 'unstop', 'hackerearth', 'hackerrank', 'internshala', 'google', 'microsoft', 'amazon', 'mlh', 'luma', 'eventbrite', 'typeform', 'cognitoforms'
];

// DEVPOST SPECIAL HANDLING
// Devpost sends many promotional and friend notification emails that cause false positives
// DEVPOST SPECIAL HANDLING
// Devpost sends many promotional and friend notification emails that cause false positives
const DEVPOST_CRITICAL_REJECT_PATTERNS = [
    // Friend notifications - ALWAYS REJECT
    'just registered', 'also registered', 'joined this hackathon', 'is participating',
    'your friend', 'your connection', 'someone you follow', 'people you follow',
    'check out who', 'see who', 'friend registered'
];

const DEVPOST_SOFT_REJECT_PATTERNS = [
    // Promotional/Footer noise - REJECT ONLY IF NO ACCEPT PATTERN FOUND
    'trending hackathons', 'recommended for you', 'you might like',
    'popular hackathons', 'happening soon', 'check out these',
    'featured hackathons', 'explore hackathons', 'new opportunities',
    'discover hackathons', 'browse hackathons',

    // Newsletter/updates
    'weekly digest', 'monthly update', 'newsletter',
    'your dashboard', 'view all submissions', 'your profile',
    'notifications from devpost', 'devpost digest'
];

const DEVPOST_ACCEPT_PATTERNS = [
    // Only accept these strong registration signals for Devpost
    'you successfully submitted', 'your submission',
    'submission received', 'submission confirmed',
    'you\'re registered', 'registration confirmed',
    'you joined', 'you\'re participating',
    'thanks for registering', 'you registered for',
    'welcome to the team', 'you\'re in', 'thank you for registering', 'shortlisted', 'selected', 'confirmed', 'you’re in', 'congratulations', 'ticket', 'Ready To Hack?'
];

/**
 * ------------------------------------------------------------------
 * UTILITIES
 * ------------------------------------------------------------------
 */

const tokenize = (text) => {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2);
};

const extractBodyFromPayload = (payload) => {
    let body = '';
    if (payload.parts) {
        payload.parts.forEach(part => {
            if (part.mimeType === 'text/plain' && part.body && part.body.data) {
                body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.parts) {
                body += extractBodyFromPayload(part);
            }
        });
    } else if (payload.body && payload.body.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    return body || payload.snippet || '';
};

/**
 * Check if email is from Devpost
 */
const isDevpostEmail = (from) => {
    return from.toLowerCase().includes('devpost');
};

/**
 * Apply strict filtering for Devpost emails to reduce false positives
 * Returns { shouldReject: boolean, reason: string }
 */
const filterDevpostEmail = (emailData) => {
    const { subject, body } = emailData;
    const cleanSubject = (subject || '').toLowerCase();
    const cleanBody = (body || '').toLowerCase();
    const content = cleanSubject + ' ' + cleanBody;

    // 1. Critical Reject Check (Fail Fast)
    // Always reject these (e.g., friend notifications) regardless of anything else
    for (const pattern of DEVPOST_CRITICAL_REJECT_PATTERNS) {
        if (content.includes(pattern)) {
            return {
                shouldReject: true,
                reason: `Devpost: Critical Reject "${pattern}"`
            };
        }
    }

    // 2. Check Acceptance
    let hasAcceptPattern = false;
    let matchedPattern = null;
    for (const pattern of DEVPOST_ACCEPT_PATTERNS) {
        if (content.includes(pattern)) {
            hasAcceptPattern = true;
            matchedPattern = pattern;
            break;
        }
    }

    // 3. Soft Reject Check (Only if NO acceptance)
    // If we found an ACCEPT pattern, we ignore soft rejects (treating them as footer noise)
    if (!hasAcceptPattern) {
        for (const pattern of DEVPOST_SOFT_REJECT_PATTERNS) {
            if (content.includes(pattern)) {
                return {
                    shouldReject: true,
                    reason: `Devpost: Soft Reject "${pattern}" (No accept signal)`
                };
            }
        }

        // If neither accept nor reject pattern found, fail safe
        // Devpost emails are noisy, so we default to REJECT if no explicit confirmation is found
        return {
            shouldReject: true,
            reason: 'Devpost: No explicit registration confirmation found'
        };
    }

    // If we reach here, we have an acceptance pattern and no critical rejects
    return {
        shouldReject: false,
        matchedPattern
    };
};

/**
 * ------------------------------------------------------------------
 * CORE INTELLIGENCE ENGINE (Redesigned)
 * ------------------------------------------------------------------
 */

const analyzeEmail = (emailData, competitionTitle, knownPlatform = null) => {
    // INPUT: emailData = { subject, body, from, received_date }
    const { subject, body, from } = emailData;

    // DEVPOST SPECIAL HANDLING - Apply strict filtering first
    if (isDevpostEmail(from)) {
        const filterResult = filterDevpostEmail(emailData);
        if (filterResult.shouldReject) {
            return {
                detected: false,
                confidence: 'REJECTED',
                total_score: 0,
                score_breakdown: { intent: 0, platform: 0, title_match: 0 },
                reasoning: [filterResult.reason],
                confidence_score: 0,
                is_registration_related: false,
                suggested_status: 'NOT_FOUND',
                event_name: competitionTitle,
                classification: 'rejected',
                devpost_filter: true
            };
        }
        // If passed filter, continue with normal scoring but note the matched pattern
        console.log(`[Devpost Filter] Accepted email with pattern: "${filterResult.matchedPattern}"`);
    }

    const cleanSubject = (subject || '').toLowerCase();
    const cleanBody = (body || '').toLowerCase();
    const cleanFrom = (from || '').toLowerCase();
    const cleanTitle = (competitionTitle || '').toLowerCase();

    let score = 0;
    const score_breakdown = { intent: 0, platform: 0, title_match: 0 };
    const reasoning = [];

    // 1. INTENT SIGNAL (Max 40)
    let intentScore = 0;
    let foundIntent = null;

    // Check Exact (+40)
    for (const signal of INTENT_EXACT) {
        if (cleanSubject.includes(signal) || cleanBody.includes(signal)) {
            intentScore = 50;
            foundIntent = `Exact: "${signal}"`;
            break;
        }
    }
    // Check Strong (+30) if not exact
    if (intentScore === 0) {
        for (const signal of INTENT_STRONG) {
            if (cleanSubject.includes(signal) || cleanBody.includes(signal)) {
                intentScore = 40;
                foundIntent = `Strong: "${signal}"`;
                break;
            }
        }
    }
    // Check Weak (+20) if not strong
    if (intentScore === 0) {
        for (const signal of INTENT_WEAK) {
            if (cleanSubject.includes(signal) || cleanBody.includes(signal)) {
                intentScore = 30;
                foundIntent = `Weak: "${signal}"`;
                break;
            }
        }
    }

    score += intentScore;
    score_breakdown.intent = intentScore;
    if (foundIntent) reasoning.push(`(+${intentScore}) Intent found: ${foundIntent}`);
    else reasoning.push(`(0) No intent signal found`);
    // 2. PLATFORM / SENDER SIGNAL (Max 30)
    let platformScore = 0;
    let foundPlatform = null;
    // Check Platform Domain/Sender (+30)
    const platformsToCheck = [...KNOWN_PLATFORMS];
    if (knownPlatform) platformsToCheck.push(knownPlatform.toLowerCase());
    for (const p of platformsToCheck) {
        if (cleanFrom.includes(p)) {
            platformScore = 20;
            foundPlatform = `Sender Domain: ${p}`;
            break;
        }
    }

    // Check Mention in Text (+20) if not sender
    if (platformScore === 0) {
        for (const p of platformsToCheck) {
            if (cleanSubject.includes(p) || cleanBody.includes(p)) {
                platformScore = 10;
                foundPlatform = `Mentioned: ${p}`;
                break;
            }
        }
    }

    score += platformScore;
    score_breakdown.platform = platformScore;
    if (foundPlatform) reasoning.push(`(+${platformScore}) Platform matched: ${foundPlatform}`);
    else reasoning.push(`(0) No platform association found`);


    // 3. COMPETITION TITLE MATCH (Max 30)
    // Logic: Token overlap
    let titleScore = 0;
    const titleTokens = tokenize(cleanTitle);
    const uniqueTitleTokens = [...new Set(titleTokens)];
    const contentText = cleanSubject + " " + cleanBody.substring(0, 1000); // Check first 1000 chars of body

    if (uniqueTitleTokens.length > 0) {
        let matchedTokens = 0;
        uniqueTitleTokens.forEach(t => {
            if (contentText.includes(t)) matchedTokens++;
        });

        const matchRatio = matchedTokens / uniqueTitleTokens.length;

        if (cleanSubject.includes(cleanTitle)) {
            titleScore = 30;
            reasoning.push(`(+30) Exact title match in subject`);
        } else if (matchRatio >= 0.75) { // e.g. 3 out of 4 words
            titleScore = 30; // Treat high partial as exact equivalent
            reasoning.push(`(+30) Strong partial title match (${matchedTokens}/${uniqueTitleTokens.length} words)`);
        } else if (matchRatio >= 0.5) {
            titleScore = 20;
            reasoning.push(`(+20) Major title words matched (${matchedTokens}/${uniqueTitleTokens.length} words)`);
        } else if (matchRatio > 0) {
            titleScore = 10;
            reasoning.push(`(+10) Weak title match (${matchedTokens}/${uniqueTitleTokens.length} words)`);
        } else {
            reasoning.push(`(0) No title words matched`);
        }
    }

    score += titleScore;
    score_breakdown.title_match = titleScore;

    // Caps
    score = Math.min(100, score);

    // CLASSIFICATION
    let detected = false;
    let confidence = 'LOW';

    if (score >= 70) {
        detected = true;
        confidence = 'HIGH';
    } else if (score >= 50) {
        detected = true;
        confidence = 'MEDIUM';
    }

    return {
        detected,
        confidence,
        total_score: score,
        score_breakdown,
        reasoning,

        // Backward compatibility for existing controller logic
        confidence_score: score,
        is_registration_related: detected,
        suggested_status: detected ? (confidence === 'HIGH' ? 'REGISTERED' : 'PENDING') : 'NOT_FOUND',
        event_name: cleanTitle, // Passthrough
        classification: confidence.toLowerCase()
    };
};


/**
 * ------------------------------------------------------------------
 * SERVICE FUNCTIONS
 * ------------------------------------------------------------------
 */

/**
 * Fetch recent emails from Gmail API
 */
const fetchRecentEmails = async (accessToken, days = 90) => {
    try {
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
            maxResults: 50 // Fetch batch
        });

        const messages = response.data.messages || [];
        const results = [];

        console.log(`[GmailService] Found ${messages.length} emails. Fetching details...`);

        // Fetch details for each message
        for (const msg of messages) {
            try {
                const msgDetails = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'full' // Request full format to get snippet + payload
                });

                const headers = msgDetails.data.payload.headers;
                const subject = headers.find(h => h.name === 'Subject')?.value || '';
                const from = headers.find(h => h.name === 'From')?.value || '';
                const dateHeader = headers.find(h => h.name === 'Date')?.value || '';

                results.push({
                    id: msg.id,
                    subject,
                    from,
                    date: dateHeader,
                    snippet: msgDetails.data.snippet,
                    body: extractBodyFromPayload(msgDetails.data.payload),
                    sender: from
                });
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
 * Targeted verification for a specific competition
 */
const syncStudentCompetition = async (accessToken, competition, lastSyncedAt = null) => {
    try {
        if (!accessToken) throw new Error("AccessToken is missing");

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth });

        // 1. Construct Query
        const titleTokens = tokenize(competition.title);
        const mainTerms = titleTokens.slice(0, 2).join(' ');
        let queryString = `"${mainTerms}"`;
        if (competition.platform) {
            queryString = `(${queryString}) OR "${competition.platform}"`;
        }

        // Date Query
        if (lastSyncedAt) {
            const date = new Date(lastSyncedAt);
            if (!isNaN(date)) {
                queryString += ` after:${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            }
        } else {
            // Default 6 months lookback for sync
            const date = new Date();
            date.setMonth(date.getMonth() - 6);
            queryString += ` after:${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        }

        const response = await gmail.users.messages.list({
            userId: 'me',
            q: queryString,
            maxResults: 10
        });

        const messages = response.data.messages || [];
        if (messages.length === 0) {
            return { suggested_status: 'NOT_FOUND', confidence: 0 };
        }

        let bestMatch = null;
        let bestScore = -1;

        for (const msg of messages) {
            const msgDetails = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full'
            });

            const headers = msgDetails.data.payload.headers;
            const emailData = {
                subject: headers.find(h => h.name === 'Subject')?.value || '',
                from: headers.find(h => h.name === 'From')?.value || '',
                date: headers.find(h => h.name === 'Date')?.value || '',
                snippet: msgDetails.data.snippet,
                body: extractBodyFromPayload(msgDetails.data.payload)
            };

            // Explicit Time Window Check (Gmail API 'after' is only Day-level precision)
            const msgTimestamp = parseInt(msgDetails.data.internalDate);
            if (lastSyncedAt) {
                const syncFromTs = new Date(lastSyncedAt).getTime();
                if (msgTimestamp < syncFromTs) {
                    console.log(`[GmailService] Skipping valid match due to precise time window. Msg: ${msgTimestamp} < SyncFrom: ${syncFromTs}`);
                    continue;
                }
            }

            // Pass title and platform for new logic
            const analysis = analyzeEmail(emailData, competition.title, competition.platform);

            // Check if this email is actually about THE competition we are syncing
            // Simple check: does the email mention the competition title or similar?
            // The query was broad, so analysis score helps.

            // Title match is now handled inside analyzeEmail

            // Attach metadata to analysis for upstream matching
            analysis.id = msg.id; // Critical: Capture ID for DB
            analysis.subject = emailData.subject;
            analysis.from = emailData.from;
            analysis.snippet = emailData.snippet;

            if (analysis.confidence_score > bestScore) {
                bestScore = analysis.confidence_score;
                bestMatch = analysis;
            }
        }

        if (!bestMatch || bestScore < 40) {
            return { suggested_status: 'NOT_FOUND', confidence: bestScore };
        }

        // Map 'classification' to 'suggested_status'
        // HARDENED RULES: >= 80 is REGISTERED (Was 90). score 85 should pass.
        let suggested_status = 'PENDING';
        if (bestScore >= 70) suggested_status = 'REGISTERED';
        else if (bestScore >= 60) suggested_status = 'PENDING';

        return {
            suggested_status,
            confidence: bestScore,
            detected_at: new Date().toISOString(),
            source: 'AUTO_GMAIL',
            gmail_message_id: bestMatch.id, // Return the ID
            match_details: bestMatch,
            // Deep Log Details
            email_meta: {
                subject: bestMatch?.subject || "N/A", // We need to fix this, analyzeEmail doesn't return subject.
                sender: bestMatch?.from || "N/A",
                snippet: bestMatch?.snippet || "N/A"
            }
        };

    } catch (error) {
        console.error('Error in Matching Engine:', error.message);
        throw error;
    }
};

module.exports = {
    syncStudentCompetition,
    analyzeEmail // Exported for testing/verification if needed
};
