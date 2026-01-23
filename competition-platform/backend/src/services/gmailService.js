// gmailService.js - Pure Utility Module
// Provides detection, tokenization, and scoring logic.
// Does NOT interact with Database or Gmail API directly.

// ------------------------------------------------------------------
// Constants & Keywords
// ------------------------------------------------------------------

// Improved Keywords with Context-Aware Patterns
const KEYWORDS = {
    REGISTERED: {
        primary: ['registration successful', 'registration confirmed', 'registration is confirmed', 'thank you for registering', 'you have registered', 'successfully registered'],
        secondary: ['welcome to', 'ticket confirmed', 'order confirmed', 'payment successful', 'registration receipt'],
        subject_patterns: ['registration confirmed', 'welcome to', 'you\'re registered', 'registration successful'],
        exclude_if_contains: ['not registered', 'registration failed', 'payment failed']
    },
    QUALIFIED: {
        primary: ['shortlisted', 'qualified for next round', 'selected for', 'moved to next round', 'advanced to', 'finalist'],
        secondary: ['congratulations', 'well done', 'great news'],
        subject_patterns: ['shortlisted', 'qualified', 'selected', 'round 2', 'finalist'],
        context_required: ['round', 'next', 'stage', 'phase'], // Must appear with primary keywords
        exclude_if_contains: ['not shortlisted', 'not qualified', 'not selected']
    },
    REJECTED: {
        primary: ['not selected', 'not shortlisted', 'not qualified', 'unsuccessful', 'rejected', 'disqualified'],
        secondary: ['unfortunately', 'regret to inform', 'did not qualify', 'unable to move', 'better luck'],
        subject_patterns: ['not selected', 'unsuccessful', 'rejected'],
        exclude_if_contains: [] // No exclusions for rejection
    },
    ACTION_REQUIRED: {
        primary: ['action required', 'submit by', 'deadline approaching', 'complete your submission', 'verify your submission'],
        secondary: ['round 1 submission', 'ppt submission', 'interview scheduled', 'evaluation pending', 'upload required'],
        subject_patterns: ['action required', 'submission deadline', 'complete your', 'submit your'],
        exclude_if_contains: ['submission successful', 'completed', 'not registered', 'registration failed']
    }
};

// ------------------------------------------------------------------
// Pure Utility Functions
// ------------------------------------------------------------------

/**
 * Improved hackathon status detection with context awareness
 */
const detectHackathonStatus = (emailData) => {
    const subject = (emailData.subject || '').toLowerCase();
    const snippet = (emailData.snippet || '').toLowerCase();
    const fullText = `${subject} ${snippet}`.toLowerCase();

    // Helper functions
    const hasExclusions = (text, exclusions) => exclusions.some(e => text.includes(e));

    const calculateConfidence = (primaryMatches, secondaryMatches, subjectMatches, contextMatches = 0) => {
        let confidence = 0;
        confidence += primaryMatches * 30;      // Primary keywords worth 30 points each
        confidence += secondaryMatches * 15;    // Secondary keywords worth 15 points each  
        confidence += subjectMatches * 25;      // Subject matches worth 25 points each
        confidence += contextMatches * 10;      // Context matches worth 10 points each
        return Math.min(confidence, 95);        // Cap at 95%
    };

    const results = [];

    // 1. REGISTERED
    const regKeywords = KEYWORDS.REGISTERED;
    if (!hasExclusions(fullText, regKeywords.exclude_if_contains)) {
        const primaryMatches = regKeywords.primary.filter(k => fullText.includes(k)).length;
        const secondaryMatches = regKeywords.secondary.filter(k => fullText.includes(k)).length;
        const subjectMatches = regKeywords.subject_patterns.filter(k => subject.includes(k)).length;

        if (primaryMatches > 0 || (secondaryMatches > 0 && subjectMatches > 0)) {
            const confidence = calculateConfidence(primaryMatches, secondaryMatches, subjectMatches);
            results.push({ status: 'REGISTERED', confidence, matches: primaryMatches + secondaryMatches + subjectMatches });
        }
    }

    // 2. QUALIFIED
    const qualKeywords = KEYWORDS.QUALIFIED;
    if (!hasExclusions(fullText, qualKeywords.exclude_if_contains)) {
        const primaryMatches = qualKeywords.primary.filter(k => fullText.includes(k)).length;
        const secondaryMatches = qualKeywords.secondary.filter(k => fullText.includes(k)).length;
        const subjectMatches = qualKeywords.subject_patterns.filter(k => subject.includes(k)).length;
        const contextMatches = qualKeywords.context_required.filter(k => fullText.includes(k)).length;

        if (primaryMatches > 0 || (secondaryMatches > 0 && contextMatches > 0 && subjectMatches > 0)) {
            const confidence = calculateConfidence(primaryMatches, secondaryMatches, subjectMatches, contextMatches);
            results.push({ status: 'QUALIFIED', confidence, matches: primaryMatches + secondaryMatches + subjectMatches });
        }
    }

    // 3. REJECTED
    const rejKeywords = KEYWORDS.REJECTED;
    const primaryMatches = rejKeywords.primary.filter(k => fullText.includes(k)).length;
    const secondaryMatches = rejKeywords.secondary.filter(k => fullText.includes(k)).length;
    const subjectMatches = rejKeywords.subject_patterns.filter(k => subject.includes(k)).length;

    if (primaryMatches > 0 || subjectMatches > 0) {
        const confidence = calculateConfidence(primaryMatches, secondaryMatches, subjectMatches);
        results.push({ status: 'REJECTED', confidence, matches: primaryMatches + secondaryMatches + subjectMatches });
    }

    // 4. ACTION_REQUIRED
    const actionKeywords = KEYWORDS.ACTION_REQUIRED;
    if (!hasExclusions(fullText, actionKeywords.exclude_if_contains)) {
        const primaryMatches = actionKeywords.primary.filter(k => fullText.includes(k)).length;
        const secondaryMatches = actionKeywords.secondary.filter(k => fullText.includes(k)).length;
        const subjectMatches = actionKeywords.subject_patterns.filter(k => subject.includes(k)).length;

        if (primaryMatches > 0 || (subjectMatches > 0 && secondaryMatches > 0)) {
            const confidence = calculateConfidence(primaryMatches, secondaryMatches, subjectMatches);
            results.push({ status: 'ACTION_REQUIRED', confidence, matches: primaryMatches + secondaryMatches + subjectMatches });
        }
    }

    if (results.length === 0) return null;

    // Prioritization Logic
    results.sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return b.matches - a.matches;
    });

    if (results.length > 1) {
        const topResult = results[0];
        const secondResult = results[1];
        // Prefer REGISTERED over slightly higher QUALIFIED if close, as REGISTERED is safer default
        if (topResult.status === 'QUALIFIED' && secondResult.status === 'REGISTERED') {
            if (topResult.confidence - secondResult.confidence < 20) {
                return { status: 'REGISTERED', confidence: secondResult.confidence };
            }
        }
    }

    return { status: results[0].status, confidence: results[0].confidence };
};

/**
 * Tokenize string: lowercase, remove stopwords, split
 */
const tokenize = (text) => {
    if (!text || typeof text !== 'string') return [];
    const stopwords = [
        'the', 'of', 'for', 'in', 'and', 'at', 'to', 'a', 'an', 'is', 'on', 'with', 'by',
        'competition', 'hackathon', 'event', 'challenge', 'contest', 'fest',
        'hack', 'hacks', 'code', 'coding', 'program', 'championship',
        '2024', '2025', '2026', 'national', 'global', 'international'
    ];
    return text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/[\s-]+/)
        .filter(t => t.length > 2 && !stopwords.includes(t));
};

/**
 * Extract Hackathon Name from Subject
 */
const extractHackathonName = (subject, sender) => {
    const separators = ['|', '–', '-', ':', '[', ']'];
    for (const sep of separators) {
        if (subject.includes(sep)) {
            const parts = subject.split(sep);
            const name = parts.find(p => p.trim().length > 3);
            if (name) return name.trim();
        }
    }

    let finalName = subject;
    const prefixes = [
        'Welcome to ', 'Registration Confirmed: ', 'You are registered for ', 'Registered successfully for '
    ];

    for (const p of prefixes) {
        if (finalName.toLowerCase().startsWith(p.toLowerCase())) {
            finalName = finalName.substring(p.length);
        }
    }
    finalName = finalName.replace(/^[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]\s*/gu, '');
    finalName = finalName.replace(/[!.]+$/, '');

    if (['congratulations', 'reminder', 'update'].includes(finalName.toLowerCase())) {
        return subject;
    }
    return finalName.trim();
};

/**
 * calculateMatchScore
 * Kept for potential advanced matching needs
 */
const calculateMatchScore = (email, competition) => {
    let score = 0;
    const breakdown = [];
    const matched_signals = { platform: false, date: false, tokens: [], organizer: false };

    const emailDate = new Date(email.date);
    const subjectLower = (email.subject || '').toLowerCase();
    const fromLower = (email.from || '').toLowerCase();
    const textToCheck = `${subjectLower} ${email.snippet || ''}`.toLowerCase();

    // 1. PLATFORM
    if (competition.platform) {
        const platform = competition.platform.toLowerCase();
        if (fromLower.includes(platform) || (fromLower.includes('no-reply') && textToCheck.includes(platform))) {
            score += 40;
            breakdown.push('Platform Match (+40)');
            matched_signals.platform = true;
        }
    }

    // 2. DATE
    if (competition.registration_start && competition.registration_deadline) {
        const start = new Date(competition.registration_start);
        const end = new Date(competition.registration_deadline);
        end.setDate(end.getDate() + 7);
        if (emailDate >= start && emailDate <= end) {
            score += 25;
            breakdown.push('Date Window (+25)');
            matched_signals.date = true;
        }
    }

    // 3. TOKENS
    const titleTokens = tokenize(competition.title);
    let tokenScore = 0;
    const foundTokens = [];
    titleTokens.forEach(token => {
        if (textToCheck.includes(token)) {
            tokenScore += 5;
            foundTokens.push(token);
        }
    });

    if (foundTokens.length === 0) {
        return {
            score: 0,
            breakdown: ['Failed: No title tokens found'],
            matched_signals,
            confidence_level: 'NONE',
            detected_status: null,
            status_confidence: 0
        };
    }

    if (tokenScore > 20) tokenScore = 20;
    if (tokenScore > 0) {
        score += tokenScore;
        breakdown.push(`Tokens: ${foundTokens.join(', ')} (+${tokenScore})`);
        matched_signals.tokens = foundTokens;
    }

    // 4. ORGANIZER
    if (competition.organizer) {
        const organizer = competition.organizer.toLowerCase();
        if (textToCheck.includes(organizer) || fromLower.includes(organizer)) {
            score += 20;
            breakdown.push('Organizer Match (+20)');
            matched_signals.organizer = true;
        }
    }

    // 5. STATUS
    const statusDetection = detectHackathonStatus(email);
    let detectedStatus = null;
    if (statusDetection) {
        detectedStatus = statusDetection.status;
        const statusPoints = Math.round(statusDetection.confidence * 0.15);
        score += statusPoints;
        breakdown.push(`Status: ${statusDetection.status} (${statusDetection.confidence}% confidence) (+${statusPoints})`);
    }

    let confidence_level = 'LOW';
    if (score >= 60) confidence_level = 'HIGH';
    else if (score >= 40) confidence_level = 'MEDIUM';
    else if (score >= 20) confidence_level = 'LOW_PASS';

    return {
        score,
        breakdown,
        matched_signals,
        confidence_level,
        detected_status: detectedStatus,
        status_confidence: statusDetection?.confidence || 0
    };
};

/**
 * Helper to parse email data
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
        sender: from
    };
};

module.exports = {
    detectHackathonStatus,
    calculateMatchScore,
    tokenize,
    extractHackathonName,
    parseEmail
};
