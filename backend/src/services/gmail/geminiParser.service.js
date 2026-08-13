const { generateContentWithFallback } = require('../../config/geminiClient');
const { waitForGeminiSlot } = require('../../utils/geminiRateGuard');

const parseEmailBatch = async (emailsArray, competitionTitle) => {

    try {
        // Construct the 50-Message Batch concatenated string
        let batchString = '';
        for (const email of emailsArray) {
            batchString += `\n--- START EMAIL ID: ${email.gmail_message_id} ---\n`;
            batchString += `Sender: ${email.sender}\n`;
            batchString += `Subject: ${email.subject}\n`;
            batchString += `Body: ${email.body_text}\n`;
        }

        const prompt = `You are an email classifier for a college competition tracking system.
Your task is to analyze a batch of emails related to a specific competition: "${competitionTitle}".
For each email, extract structured information and classify its status.

${batchString}

Respond ONLY with a valid JSON Array of Objects. Do not use markdown blocks.
Each object must follow this strict schema:
[
  {
    "id": "<must strictly match the EMAIL ID provided>",
    "competition_name": "<name of competition or hackathon found, or null>",
    "status": "<one of: REGISTERED | SHORTLISTED | REJECTED | WINNER | UNKNOWN>",
    "confidence": "<one of: high | medium | low>",
    "is_competition_related": <true | false>,
    "reasoning": ["brief reason 1", "brief reason 2"]
  }
]

Rules:
- CRITICAL: If the email is for a DIFFERENT competition or hackathon than "${competitionTitle}", you MUST set is_competition_related to false and all other fields to null.
- If the email is NOT competition related at all, set is_competition_related to false.
- For status: REGISTERED means confirmed registration, SHORTLISTED means selected for next round, REJECTED means not selected, WINNER means won or placed.
`;

        const request = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        await waitForGeminiSlot();
        const result = await generateContentWithFallback(request);
        if (!result) {
            return [];
        }
        const responseText = result.response.text();
        
        const parsedResult = JSON.parse(responseText);

        // Explicit 6-second token bucket pause
        await new Promise(resolve => setTimeout(resolve, 6000));

        return parsedResult;

    } catch (err) {
        console.error(`[Gemini] Batch parse failed:`, err.message);
        
        // Handle Midnight PT Reset
        if (err.message && err.message.includes('429')) {
            console.error('[Gemini] 429 Quota Exceeded hit!');
            // Calculate ms until midnight PT
            const now = new Date();
            const nowPT = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            const midnightPT = new Date(nowPT);
            midnightPT.setHours(24, 0, 0, 0); // Next midnight
            
            const delayMs = midnightPT.getTime() - nowPT.getTime();
            const delaySeconds = Math.ceil(delayMs / 1000);
            
            const quotaError = new Error(`Gemini Daily Quota Exceeded. Reset in ${delaySeconds} seconds.`);
            quotaError.type = 'QUOTA_EXCEEDED';
            quotaError.delaySeconds = delaySeconds;
            throw quotaError; // Throws to the global error handler
        }

        throw err;
    }
};

module.exports = { parseEmailBatch };
