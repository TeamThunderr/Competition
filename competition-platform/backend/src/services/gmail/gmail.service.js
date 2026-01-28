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

const INTENT_SIGNALS = [
    'registered',
    'successfully applied',
    'application received',
    'you’re in',
    'shortlisted',
    'selection round',
    'submission received',
    'dashboard access',
    'team confirmation',
    'registration confirmed',
    'thank you for registering',
    'you have registered',
    'welcome to',
    'ticket',
    'finalize your registration',
    'complete your registration'
];

const PLATFORM_SIGNALS = [
    'Devfolio',
    'Unstop',
    'HackerRank',
    'Internshala',
    'Google',
    'Microsoft',
    'Amazon',
    'MLH',
    'Luma',
    'Eventbrite'
];

const ACTION_INDICATORS = [
    'dashboard',
    'complete your profile',
    'view application',
    'next steps',
    'round 1',
    'submission',
    'deadline'
];

const NEGATIVE_SIGNALS = [
    'newsletter',
    'recommendation',
    'apply now', // Usually promotional
    'invitation to apply',
    'last chance to register', // Promotional
    'register now'
];


/**
 * ------------------------------------------------------------------
 * UTILITIES
 * ------------------------------------------------------------------
 */

/**
 * Simple tokenizer
 */
const tokenize = (text) => {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/[\s-]+/)
        .filter(t => t.length > 2);
};

/**
 * Extract plain text body from Gmail Payload
 */
const extractBodyFromPayload = (payload) => {
    let body = '';
    if (payload.parts) {
        payload.parts.forEach(part => {
            if (part.mimeType === 'text/plain' && part.body && part.body.data) {
                body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.parts) { // Recursive for nested parts
                body += extractBodyFromPayload(part);
            }
        });
    } else if (payload.body && payload.body.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    return body || payload.snippet || '';
};

/**
 * Extract Event Name
 * Rule: clearly (title case / repeated) OR tied to dashboard/app reference
 */
const extractEventName = (subject, body) => {
    const genericTerms = [
        'reminder', 'update', 'alert', 'notification', 'congratulations', 'invitation',
        'complete your profile', 'complete your registration', 'action required'
    ];

    // Strategy 1: Subject extraction (Separators)
    const separators = ['|', '–', '-', ':', '[', ']'];
    for (const sep of separators) {
        if (subject.includes(sep)) {
            const parts = subject.split(sep);
            // Look for Title Case-ish, length > 3, and NOT generic
            const name = parts.find(p => {
                const trimmed = p.trim();
                return trimmed.length > 3 &&
                    /^[A-Z]/.test(trimmed) &&
                    !genericTerms.includes(trimmed.toLowerCase());
            });
            if (name) return name.trim();
        }
    }

    // Strategy 2: Common Prefixes
    const prefixes = [
        'Welcome to ',
        'Registration Confirmed: ',
        'You are registered for ',
        'Registered successfully for ',
        'Application received for ',
        'Successfully Registered'
    ];

    let finalName = subject;
    for (const p of prefixes) {
        if (finalName.toLowerCase().startsWith(p.toLowerCase())) {
            finalName = finalName.substring(p.length);
        }
    }

    // Clean emojis
    finalName = finalName.replace(/^[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]\s*/gu, '');
    finalName = finalName.replace(/[!.]+$/, '').trim();

    // Final check for generic subject
    if (genericTerms.includes(finalName.toLowerCase())) {
        return null; // Or return original subject if we want? But null acts as "not found"
    }

    return finalName;
};

/**
 * ------------------------------------------------------------------
 * CORE INTELLIGENCE ENGINE
 * ------------------------------------------------------------------
 */

const analyzeEmail = (emailData, studentEmail = '') => {
    // INPUT: emailData = { subject, body, from, received_date }
    const { subject, body, from, received_date } = emailData;
    const cleanSubject = (subject || '').toLowerCase();
    const cleanBody = (body || '').toLowerCase();
    const cleanFrom = (from || '').toLowerCase();
    const cleanStudentEmail = (studentEmail || '').toLowerCase();

    const reasoning = [];
    const signals_detected = {
        intent_keywords: [],
        platform_indicators: [],
        action_indicators: [],
        date_detected: false,
        user_identity_match: false
    };

    let score = 0;

    // 1. INTENT DETECTION (+30)
    for (const signal of INTENT_SIGNALS) {
        if (cleanSubject.includes(signal) || cleanBody.includes(signal)) {
            if (!signals_detected.intent_keywords.includes(signal)) {
                signals_detected.intent_keywords.push(signal);
                // Only add score once for intent category to avoid double counting synonyms
                if (score < 30) {
                    // Check if we already added intent score? 
                    // Actually, let's just add it if signals_detected.intent_keywords was empty
                }
            }
        }
    }

    if (signals_detected.intent_keywords.length > 0) {
        score += 30;
        reasoning.push(`Detected registration intent signals: ${signals_detected.intent_keywords.join(', ')}`);
    }

    // 2. PLATFORM / ORGANIZATION SIGNALS (+20)
    let detectedPlatform = null;
    for (const signal of PLATFORM_SIGNALS) {
        const lowerSignal = signal.toLowerCase();
        if (cleanFrom.includes(lowerSignal) || cleanBody.includes(lowerSignal) || cleanSubject.includes(lowerSignal)) {
            if (!signals_detected.platform_indicators.includes(signal)) {
                signals_detected.platform_indicators.push(signal);
            }
            if (!detectedPlatform) detectedPlatform = signal;
        }
    }

    if (signals_detected.platform_indicators.length > 0) {
        score += 20;
        reasoning.push(`Identified platform/organization: ${signals_detected.platform_indicators.join(', ')}`);
    }

    // 3. ACTION INDICATORS (+15)
    for (const signal of ACTION_INDICATORS) {
        if (cleanBody.includes(signal)) {
            if (!signals_detected.action_indicators.includes(signal)) {
                signals_detected.action_indicators.push(signal);
            }
        }
    }

    if (signals_detected.action_indicators.length > 0) {
        score += 15;
        reasoning.push(`Found actionable next steps: ${signals_detected.action_indicators.join(', ')}`);
    }

    // 4. IDENTITY MATCH (+10)
    if (cleanStudentEmail && cleanBody.includes(cleanStudentEmail)) {
        signals_detected.user_identity_match = true;
        score += 10;
        reasoning.push('Email body contains student email address, high confidence of personal relevance.');
    }

    // 5. EVENT NAME (+15)
    const eventName = extractEventName(subject, body);
    if (eventName && eventName !== subject) { // If extraction did something meaningful
        score += 15;
        reasoning.push(`Extracted event name: "${eventName}"`);
    }

    // 6. DATE DETECTED (+10)
    // Simple verification if "date" or month names appear near numbers
    const dateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}/i;
    if (dateRegex.test(cleanBody)) {
        signals_detected.date_detected = true;
        score += 10;
        reasoning.push('Date/Deadline detected in content.');
    }

    // NEGATIVE SIGNALS (Sanity Check)
    if (NEGATIVE_SIGNALS.some(ns => cleanSubject.includes(ns))) {
        score -= 50; // Heavily penalize promos
        reasoning.push('Detected promotional/newsletter signals.');
    }

    // CLASSIFICATION
    let classification = 'not_related';
    if (score >= 80) classification = 'confirmed';
    else if (score >= 60) classification = 'probable';
    else if (score >= 40) classification = 'needs_review';

    // Cap score at 100, min 0
    score = Math.max(0, Math.min(100, score));

    // Special Case: Shortlisting -> Confirmed
    if (cleanSubject.includes('shortlisted') || cleanSubject.includes('congratulations')) {
        classification = 'confirmed';
        score = Math.max(score, 90);
        reasoning.push('Explicit shortlist/congratulation signal overrides score.');
    }

    return {
        is_registration_related: ['confirmed', 'probable'].includes(classification),
        confidence_score: score,
        classification,
        event_name: eventName,
        organization_or_platform: detectedPlatform || 'Other',
        reasoning,
        signals_detected
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

            const analysis = analyzeEmail(emailData); // Pass student email if avail

            // Check if this email is actually about THE competition we are syncing
            // Simple check: does the email mention the competition title or similar?
            // The query was broad, so analysis score helps.

            // Add extra weight if title matches explicitly
            if (emailData.subject.toLowerCase().includes(competition.title.toLowerCase()) ||
                emailData.body.toLowerCase().includes(competition.title.toLowerCase())) {
                analysis.confidence_score += 20; // Boost for specific match
            }

            if (analysis.confidence_score > bestScore) {
                bestScore = analysis.confidence_score;
                bestMatch = analysis;
            }
        }

        if (!bestMatch || bestScore < 40) {
            return { suggested_status: 'NOT_FOUND', confidence: bestScore };
        }

        // Map 'classification' to 'suggested_status'
        let suggested_status = 'PENDING';
        if (bestMatch.classification === 'confirmed') suggested_status = 'REGISTERED';
        else if (bestMatch.classification === 'probable') suggested_status = 'REGISTERED'; // Optimistic

        return {
            suggested_status,
            confidence: bestScore,
            detected_at: new Date().toISOString(),
            source: 'AUTO_GMAIL',
            match_details: bestMatch
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
