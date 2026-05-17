const gmailService = require('../services/gmail/gmail.service');

const testCases = [
    {
        description: "Registration Confirmed - Devfolio",
        input: {
            subject: "Registration Confirmed: TechSprint 2026",
            body: "Hi Alex, You have successfully applied to TechSprint 2026! Proceed to your dashboard to complete your profile.",
            from: "team@devfolio.co",
            received_date: new Date().toISOString()
        },
        studentEmail: "alex@example.com",
        expected: {
            is_registration_related: true,
            classification: "confirmed",
            event_name: "TechSprint 2026",
            platform: "Devfolio"
        }
    },
    {
        description: "Shortlisted Notification",
        input: {
            subject: "You are Shortlisted for HackNova!",
            body: "Congratulations! You have been selected for the final round.",
            from: "organizer@hacknova.com",
            received_date: new Date().toISOString()
        },
        studentEmail: "alex@example.com",
        expected: {
            is_registration_related: true,
            classification: "confirmed"
        }
    },
    {
        description: "Promotional / Newsletter (Negative)",
        input: {
            subject: "Invitation to Apply: CodeFest",
            body: "Don't miss out! Apply now for CodeFest. Last chance to register.",
            from: "newsletter@coding.com",
            received_date: new Date().toISOString()
        },
        studentEmail: "alex@example.com",
        expected: {
            classification: "not_related" // Should be low confidence or not_related
        }
    },
    {
        description: "Generic Reminder (Probable)",
        input: {
            subject: "Reminder: Complete your profile",
            body: "Hi, please complete your profile to finalize your registration for the event.",
            from: "no-reply@unstop.com",
            received_date: new Date().toISOString()
        },
        studentEmail: "alex@example.com",
        expected: {
            classification: "probable" // or confirmed depending on score
        }
    }
];

console.log("Running Gmail Intelligence Engine Tests...\n");

testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.description}`);
    const result = analyzeEmail(test.input, test.studentEmail);

    const passed =
        (!test.expected.is_registration_related || result.is_registration_related === test.expected.is_registration_related) &&
        (!test.expected.classification || result.classification === test.expected.classification || (test.expected.classification === 'not_related' && !result.is_registration_related)) &&
        (!test.expected.event_name || result.event_name === test.expected.event_name) &&
        (!test.expected.platform || result.organization_or_platform === test.expected.platform);

    if (passed) {
        console.log("✅ PASS");
    } else {
        console.log("❌ FAIL");
        console.log("Expected:", JSON.stringify(test.expected, null, 2));
        console.log("Actual:", JSON.stringify(result, null, 2));
    }
    console.log("---------------------------------------------------");
});
