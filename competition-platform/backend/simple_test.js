// Simple test for Gmail logic
console.log("Testing Gmail logic...");

// Test the improved keywords structure
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
        context_required: ['round', 'next', 'stage', 'phase'],
        exclude_if_contains: ['not shortlisted', 'not qualified', 'not selected']
    },
    REJECTED: {
        primary: ['not selected', 'not shortlisted', 'not qualified', 'unsuccessful', 'rejected', 'disqualified'],
        secondary: ['unfortunately', 'regret to inform', 'did not qualify', 'unable to move', 'better luck'],
        subject_patterns: ['not selected', 'unsuccessful', 'rejected'],
        exclude_if_contains: []
    },
    ACTION_REQUIRED: {
        primary: ['action required', 'submit by', 'deadline approaching', 'complete your', 'verify your'],
        secondary: ['round 1 submission', 'ppt submission', 'interview scheduled', 'evaluation pending'],
        subject_patterns: ['action required', 'submission deadline', 'complete'],
        exclude_if_contains: ['submission successful', 'completed']
    }
};

// Simple detection function
const detectHackathonStatus = (emailData) => {
    const subject = (emailData.subject || '').toLowerCase();
    const snippet = (emailData.snippet || '').toLowerCase();
    const fullText = `${subject} ${snippet}`.toLowerCase();

    const containsAny = (text, keywords) => keywords.some(k => text.includes(k));
    const hasExclusions = (text, exclusions) => exclusions.some(e => text.includes(e));

    const calculateConfidence = (primaryMatches, secondaryMatches, subjectMatches, contextMatches = 0) => {
        let confidence = 0;
        confidence += primaryMatches * 30;
        confidence += secondaryMatches * 15;
        confidence += subjectMatches * 25;
        confidence += contextMatches * 10;
        return Math.min(confidence, 95);
    };

    const results = [];

    // Check REGISTERED
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

    // Check QUALIFIED
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

    if (results.length === 0) return null;
    
    results.sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return b.matches - a.matches;
    });

    // Business logic: prefer REGISTERED over QUALIFIED if confidence difference is small
    if (results.length > 1) {
        const topResult = results[0];
        const secondResult = results[1];
        
        if (topResult.status === 'QUALIFIED' && secondResult.status === 'REGISTERED') {
            if (topResult.confidence - secondResult.confidence < 20) {
                return { status: 'REGISTERED', confidence: secondResult.confidence };
            }
        }
    }

    return { status: results[0].status, confidence: results[0].confidence };
};

// Test cases
const testEmails = [
    {
        name: "Registration Confirmation",
        email: {
            subject: "Registration Confirmed: TechSprint 2024",
            snippet: "Thank you for registering for TechSprint 2024. Your registration is confirmed."
        },
        expected: "REGISTERED"
    },
    {
        name: "Registration with Congratulations",
        email: {
            subject: "Congratulations! Welcome to HackIndia 2024",
            snippet: "Your registration for HackIndia 2024 is successful. Welcome to the competition!"
        },
        expected: "REGISTERED"
    },
    {
        name: "Qualification Notification",
        email: {
            subject: "Shortlisted for Round 2 - TechFest 2024",
            snippet: "Congratulations! You have been shortlisted for the next round of TechFest 2024."
        },
        expected: "QUALIFIED"
    }
];

console.log("🧪 Testing Improved Gmail Sync Logic\n");

testEmails.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`Subject: ${test.email.subject}`);
    console.log(`Snippet: ${test.email.snippet}`);
    
    const result = detectHackathonStatus(test.email);
    
    if (result) {
        console.log(`✅ Detected: ${result.status} (${result.confidence}% confidence)`);
        console.log(`Expected: ${test.expected}`);
        
        if (result.status === test.expected) {
            console.log("✅ PASS\n");
        } else {
            console.log("❌ FAIL\n");
        }
    } else {
        console.log("❌ No status detected");
        console.log(`Expected: ${test.expected}`);
        console.log("❌ FAIL\n");
    }
});