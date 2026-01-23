// Test script for improved Gmail sync logic
const { detectHackathonStatus, calculateMatchScore } = require('./src/services/gmailService');

// Test cases for different email scenarios
const testEmails = [
    {
        name: "Registration Confirmation",
        email: {
            subject: "Registration Confirmed: TechSprint 2024",
            snippet: "Thank you for registering for TechSprint 2024. Your registration is confirmed.",
            from: "noreply@devfolio.co"
        },
        expected: "REGISTERED"
    },
    {
        name: "Registration with Congratulations",
        email: {
            subject: "Congratulations! Welcome to HackIndia 2024",
            snippet: "Your registration for HackIndia 2024 is successful. Welcome to the competition!",
            from: "team@hackindia.com"
        },
        expected: "REGISTERED"
    },
    {
        name: "Qualification Notification",
        email: {
            subject: "Shortlisted for Round 2 - TechFest 2024",
            snippet: "Congratulations! You have been shortlisted for the next round of TechFest 2024.",
            from: "results@techfest.org"
        },
        expected: "QUALIFIED"
    },
    {
        name: "Rejection Email",
        email: {
            subject: "Unfortunately, you were not selected",
            snippet: "We regret to inform you that you were not shortlisted for the next round.",
            from: "noreply@hackathon.com"
        },
        expected: "REJECTED"
    },
    {
        name: "Action Required",
        email: {
            subject: "Action Required: Submit your presentation",
            snippet: "Please submit your PPT by tomorrow for Round 1 evaluation.",
            from: "team@competition.org"
        },
        expected: "ACTION_REQUIRED"
    },
    {
        name: "Ambiguous Congratulations (Should be REGISTERED)",
        email: {
            subject: "Congratulations on your registration!",
            snippet: "Thank you for registering. Your registration is confirmed for CodeFest 2024.",
            from: "registration@codefest.com"
        },
        expected: "REGISTERED"
    },
    {
        name: "False Positive - Not Registered",
        email: {
            subject: "You are not registered yet",
            snippet: "Please complete your registration for the hackathon before the deadline.",
            from: "reminder@hackathon.com"
        },
        expected: null // Should not detect any status
    }
];

console.log("🧪 Testing Improved Gmail Sync Logic\n");
console.log("=" * 60);

testEmails.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log("-".repeat(40));
    console.log(`Subject: ${test.email.subject}`);
    console.log(`Snippet: ${test.email.snippet}`);
    console.log(`From: ${test.email.from}`);
    
    const result = detectHackathonStatus(test.email);
    
    if (result) {
        console.log(`✅ Detected: ${result.status} (${result.confidence}% confidence)`);
        console.log(`Expected: ${test.expected}`);
        
        if (result.status === test.expected) {
            console.log("✅ PASS");
        } else {
            console.log("❌ FAIL");
        }
    } else {
        console.log("❌ No status detected");
        console.log(`Expected: ${test.expected}`);
        
        if (test.expected === null) {
            console.log("✅ PASS (Correctly ignored)");
        } else {
            console.log("❌ FAIL (Should have detected)");
        }
    }
});

console.log("\n" + "=" * 60);
console.log("🎯 Test Summary");
console.log("=" * 60);

// Test competition matching
const sampleCompetition = {
    title: "TechSprint 2024",
    platform: "Devfolio",
    organizer: "TechCorp",
    registration_start: "2024-01-01",
    registration_deadline: "2024-01-15"
};

const sampleEmail = {
    subject: "Registration Confirmed: TechSprint 2024",
    snippet: "Thank you for registering for TechSprint 2024 on Devfolio.",
    from: "noreply@devfolio.co",
    date: "2024-01-10"
};

console.log("\n🎯 Testing Competition Matching:");
console.log("-".repeat(40));

try {
    const matchResult = calculateMatchScore(sampleEmail, sampleCompetition);
    console.log(`Match Score: ${matchResult.score}`);
    console.log(`Confidence Level: ${matchResult.confidence_level}`);
    console.log(`Detected Status: ${matchResult.detected_status}`);
    console.log(`Status Confidence: ${matchResult.status_confidence}%`);
    console.log(`Breakdown: ${matchResult.breakdown.join(', ')}`);
} catch (error) {
    console.error("❌ Error in calculateMatchScore:", error.message);
}