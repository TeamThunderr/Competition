const { google } = require('googleapis');
const supabase = require('../config/supabaseClient');

// Keywords per status
const KEYWORDS = {
    REGISTERED: ['registered', 'registration successful', 'registration confirmed', 'registration is confirmed', 'thank you for registering', 'you have registered', 'successfully registered'],
    QUALIFIED: ['shortlisted', 'qualified', 'selected', 'congratulations', 'moved to next round', 'finalist'],
    REJECTED: ['not selected', 'unfortunately', 'regret to inform', 'did not qualify', 'unsuccessful', 'rejected', 'disqualified', 'not registered', 'not qualified', 'not shortlisted', 'not finalist'],
    ACTION_REQUIRED: ['submit', 'deadline', 'round 1', 'round 2', 'presentation', 'ppt submission', 'interview', 'evaluation']
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
 * Extract useful info from raw email object
 */
const parseEmail = (emailData) => {
    const headers = emailData.payload.headers;
    const subjectHeader = headers.find(h => h.name === 'Subject');
    const fromHeader = headers.find(h => h.name === 'From');
    const dateHeader = headers.find(h => h.name === 'Date');

    return {
        id: emailData.id,
        snippet: emailData.snippet,
        subject: subjectHeader ? subjectHeader.value : 'No Subject',
        sender: fromHeader ? fromHeader.value : 'Unknown',
        date: dateHeader ? new Date(dateHeader.value) : new Date(),
        internalDate: new Date(parseInt(emailData.internalDate))
    };
};

/**
 * Detect hackathon status based on keywords
 */
const detectHackathonStatus = (text) => {
    const lowerText = text.toLowerCase();
    let detectedStatus = null;
    let maxPriority = 0; // 4: Qualified, 3: Registered, 2: Rejected, 1: Action

    // Check Qualified (Highest Priority)
    if (KEYWORDS.QUALIFIED.some(k => lowerText.includes(k))) {
        return { status: 'QUALIFIED', confidence: 90 };
    }

    // Check Registered
    if (KEYWORDS.REGISTERED.some(k => lowerText.includes(k))) {
        return { status: 'REGISTERED', confidence: 80 };
    }

    // Check Rejected
    if (KEYWORDS.REJECTED.some(k => lowerText.includes(k))) {
        return { status: 'REJECTED', confidence: 70 };
    }

    // Check Action Required
    if (KEYWORDS.ACTION_REQUIRED.some(k => lowerText.includes(k))) {
        return { status: 'ACTION_REQUIRED', confidence: 60 };
    }

    return null;
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
 * Main Logic to Process and Save
 */
const processAndSaveEmails = async (accessToken, userId) => {
    const emails = await fetchRecentEmails(accessToken);
    const detectedList = [];

    for (const email of emails) {
        const combinedText = `${email.subject} ${email.snippet}`;
        const detection = detectHackathonStatus(combinedText);

        if (detection) {
            const hackathonName = extractHackathonName(email.subject, email.sender);

            // Check if we already saved this email (by snippet hash or ID if stored? We don't store ID yet)
            // Ideally we should check if (user_id, hackathon_name, status) exists to avoid dupes, or just insert raw.
            // For now, simple insert.

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
    // Re-use sync logic but return boolean or specific format expected by existing controllers
    try {
        const match = await syncStudentCompetition(accessToken, hackathonName, null, null);
        return !!match;
    } catch (e) {
        console.error("Verification error:", e);
        return false;
    }
};

/**
 * Targeted Sync for a specific competition for a student
 * Scope: Faculty triggers this for a list of students.
 * Limit: Fetch metadata/snippet only. Tighter query.
 */
const syncStudentCompetition = async (accessToken, competitionName, platform, lastSyncedAt, keywords = KEYWORDS) => {
    try {
        if (!accessToken) throw new Error("AccessToken is missing");

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth });

        // 1. Build Query
        // keywords: (registered OR shortlisted OR ...)
        // from: if platform known
        // after: lastSyncedAt

        const allKeywords = [
            ...keywords.REGISTERED,
            ...keywords.QUALIFIED,
            ...keywords.REJECTED,
            ...keywords.ACTION_REQUIRED
        ];

        // Optimizing Query: "(keyword1 OR keyword2 ...) AND (CompetitionName)"
        // Note: query length limit. If too many keywords, might need to split or be generic.
        // Generic approach: "CompetitionName" AND "after:..."
        // Then filter in code. This is safer for query length and Gmail limits.

        // Handling Dates
        let dateQuery = '';
        if (lastSyncedAt) {
            const date = new Date(lastSyncedAt);
            if (!isNaN(date)) {
                dateQuery = `after:${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            }
        }

        // Fallback or "Ever" sync? 
        // If lastSyncedAt is null, maybe look back 3 months (active competition window)
        if (!dateQuery) {
            const date = new Date();
            date.setDate(date.getDate() - 90);
            dateQuery = `after:${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        }

        // Platform Sender Filter (Optional but recommended)
        let fromQuery = '';
        if (platform) {
            const p = platform.toLowerCase();
            if (p.includes('devfolio')) fromQuery = 'from:(devfolio.co)';
            else if (p.includes('unstop')) fromQuery = 'from:(unstop.com)';
            else if (p.includes('hack2skill')) fromQuery = 'from:(hack2skill.com)';
            // Add others as needed
        }

        const safeCompName = competitionName.split(/[^\w\s]/)[0]; // First CLEAN part of name

        const q = `${safeCompName} ${fromQuery} ${dateQuery}`.trim();

        // 2. Fetch Messages (Metadata only)
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: q,
            maxResults: 10 // We don't need many, just the latest relevant one
        });

        const messages = response.data.messages || [];
        if (messages.length === 0) return null;

        // 3. Process Snippets (No full body)
        let bestMatch = null;
        let highestConfidence = 0;

        for (const msg of messages) {
            try {
                const msgDetails = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'metadata', // Fetch headers + snippet only
                    metadataHeaders: ['Subject', 'From', 'Date']
                });

                const emailData = parseEmail(msgDetails.data);
                const fullText = `${emailData.subject} ${emailData.snippet}`;

                // Use existing detection logic
                const detection = detectHackathonStatus(fullText);

                if (detection && detection.confidence > highestConfidence) {
                    highestConfidence = detection.confidence;
                    bestMatch = {
                        ...emailData,
                        status: detection.status,
                        confidence: detection.confidence,
                        matchedKeyword: detection.status // or specific keyword if we extracted it
                    };
                }
            } catch (e) {
                console.warn(`[GmailSync] Error parsing msg ${msg.id}:`, e.message);
            }
        }

        return bestMatch;

    } catch (error) {
        console.error('[GmailSync] Error:', error.message);
        throw error;
    }
};

module.exports = {
    processAndSaveEmails,
    verifySpecificRegistration,
    syncStudentCompetition
};
