/**
 * naiveBayes.training.js
 *
 * Training corpus for the Naive Bayes email classifier.
 * Label "competition" = emails that relate to hackathons, contests, symposia.
 * Label "irrelevant"  = everything else (orders, newsletters, admin, etc.)
 *
 * Expand this array as more edge cases are discovered.
 * After adding examples, hit POST /api/admin/classifier/retrain to reload.
 */

const trainingData = [
    // ──────────────────────────────────────────────────
    // COMPETITION — registration confirmations
    // ──────────────────────────────────────────────────
    { text: "Thank you for registering for HackFest 2025. Your registration is confirmed.", label: "competition" },
    { text: "Your submission for DevFolio Hackathon has been received.", label: "competition" },
    { text: "You are registered for Unstop's National Coding League. Event date: March 15.", label: "competition" },
    { text: "Team registration successful for Smart India Hackathon 2025.", label: "competition" },
    { text: "Registration confirmed: IEEE Xtreme Programming Contest.", label: "competition" },
    { text: "Your registration for HackerEarth Sprint is complete. Best of luck!", label: "competition" },
    { text: "Welcome to HackerRank CodeSprint. Your slot has been confirmed.", label: "competition" },
    { text: "You have successfully registered for the National Level Technical Symposium.", label: "competition" },
    { text: "Your entry to Internshala's Programming Contest has been submitted.", label: "competition" },
    { text: "Hackathon registration successful. Please check the event schedule.", label: "competition" },

    // COMPETITION — shortlist / qualification
    { text: "Congratulations! You have been shortlisted for the final round of Code Storm.", label: "competition" },
    { text: "You did not qualify for the next round of ACM ICPC Regionals.", label: "competition" },
    { text: "Your team has been selected for the on-site round of IIT Bombay Techfest.", label: "competition" },
    { text: "Congratulations! Your team has advanced to Round 2 of Smart India Hackathon.", label: "competition" },
    { text: "You have been selected as a finalist for the National Coding Championship.", label: "competition" },
    { text: "Your application to HackCBS has been reviewed. You have been shortlisted.", label: "competition" },
    { text: "Congratulations on qualifying for the onsite round of Clash of Codes.", label: "competition" },

    // COMPETITION — OD / event logistics
    { text: "Your OD request for participation in HackCBS has been acknowledged.", label: "competition" },
    { text: "Invitation to participate in the National Level Technical Symposium.", label: "competition" },
    { text: "Event reminder: HackFest 2025 begins in 2 days. Please carry your ID proof.", label: "competition" },
    { text: "Your hackathon slot is confirmed. Venue: IIT Madras. Reporting time: 8 AM.", label: "competition" },
    { text: "Reminder: Submit your project before the deadline for Devfolio Open Hack.", label: "competition" },
    { text: "Congratulations on winning the first prize at the National Coding Contest.", label: "competition" },
    { text: "Your team has been awarded the best innovation prize at HackFest.", label: "competition" },
    { text: "Certificate of participation for CodeSprint 2025 is now available for download.", label: "competition" },

    // ──────────────────────────────────────────────────
    // IRRELEVANT — e-commerce / logistics
    // ──────────────────────────────────────────────────
    { text: "Your Amazon order has been shipped. Expected delivery: 3 days.", label: "irrelevant" },
    { text: "Your Uber ride receipt for March 12.", label: "irrelevant" },
    { text: "Your Swiggy order is out for delivery. Track it live.", label: "irrelevant" },
    { text: "Your Flipkart order has been delivered. Rate your experience.", label: "irrelevant" },
    { text: "Your package from Meesho is on its way. Expected by tomorrow.", label: "irrelevant" },

    // IRRELEVANT — finance / banking
    { text: "Your monthly bank statement is now available.", label: "irrelevant" },
    { text: "Transaction alert: Rs 500 debited from your account.", label: "irrelevant" },
    { text: "Your credit card bill for the month of March is ready.", label: "irrelevant" },
    { text: "Your UPI payment of Rs 200 was successful.", label: "irrelevant" },

    // IRRELEVANT — subscriptions / marketing
    { text: "50% off on all courses this weekend only. Use code LEARN50.", label: "irrelevant" },
    { text: "Your Netflix subscription will renew on the 15th.", label: "irrelevant" },
    { text: "LinkedIn: You have 5 new connection requests.", label: "irrelevant" },
    { text: "Special offer: Buy 2 get 1 free on all merchandise. Limited time only.", label: "irrelevant" },
    { text: "Your Spotify Premium plan is about to expire. Renew now.", label: "irrelevant" },
    { text: "Exclusive deal for you: Flat 30% off on your next Zomato order.", label: "irrelevant" },

    // IRRELEVANT — college admin / non-competition
    { text: "Meeting rescheduled to Thursday 3pm. Please update your calendar.", label: "irrelevant" },
    { text: "New message from your professor regarding assignment submission.", label: "irrelevant" },
    { text: "Holiday notice: College will remain closed on account of Pongal.", label: "irrelevant" },
    { text: "Attendance report for the month of February is now available.", label: "irrelevant" },
    { text: "Exam timetable for the upcoming semester has been published.", label: "irrelevant" },
    { text: "Library book return reminder: Please return overdue books.", label: "irrelevant" },

    // IRRELEVANT — account / verification emails (non-competition)
    { text: "Verify your email address to complete your Swiggy registration.", label: "irrelevant" },
    { text: "Your password has been changed successfully.", label: "irrelevant" },
    { text: "Two-factor authentication code for your login: 482910.", label: "irrelevant" },
];

module.exports = { trainingData };
