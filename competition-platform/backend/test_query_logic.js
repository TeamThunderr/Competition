const competitionName = "TechSprint 2026 - Chennai's Biggest Student Hackathon";

const safeCompName = competitionName.split(/[^\w\s]/)[0]; // Logic from gmailService.js

console.log(`Original: "${competitionName}"`);
console.log(`Safe Name (Current Logic): "${safeCompName}"`);
console.log(`Trimmed: "${safeCompName.trim()}"`);

const q = `${safeCompName} from:(hack2skill.com)`.trim();
console.log(`Query: "${q}"`);

// Proposed Fix: Take only the first word or two?
const firstWord = competitionName.split(' ')[0];
console.log(`First Word: "${firstWord}"`);
