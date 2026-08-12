const { generateContentWithFallback } = require('../../config/geminiClient');
const { waitForGeminiSlot } = require('../../utils/geminiRateGuard');

const parseCompetitionDiscoveryEmail = async (email) => {
    const prompt = `You extract competition or event details from official college announcement emails.
Return ONLY valid JSON. Do not use markdown.
Never invent missing values. Use null when the email does not contain a value.

Email:
Sender: ${email.source_sender || email.sender || ''}
Subject: ${email.subject || ''}
Body:
${email.body_text || ''}

JSON schema:
{
  "competition_name": "string or null",
  "organizer": "string or null",
  "description": "string or null",
  "category": "string or null",
  "eligibility": "string or null",
  "registration_deadline": "ISO date string YYYY-MM-DD or null",
  "event_date": "ISO date string YYYY-MM-DD or null",
  "mode": "ONLINE | OFFLINE | HYBRID | null",
  "location": "string or null",
  "registration_url": "string URL or null",
  "official_url": "string URL or null",
  "contact_information": "string or null",
  "confidence_score": number between 0 and 1
}`;

    try {
        if (process.env.COMPETITION_DISCOVERY_GEMINI_ENABLED === 'false') {
            return null;
        }

        await waitForGeminiSlot();
        const result = await generateContentWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        });

        if (!result) return null;

        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (err) {
        if (err.message && err.message.includes('429')) {
            const quotaError = new Error(`Gemini quota/rate limit while parsing discovery email: ${err.message}`);
            quotaError.type = 'QUOTA_EXCEEDED';
            quotaError.delaySeconds = Number(process.env.SYNC_JOB_RETRY_DELAY_SECONDS || 30);
            throw quotaError;
        }
        throw err;
    }
};

module.exports = { parseCompetitionDiscoveryEmail };
