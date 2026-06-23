// File: geminiRateGuard.js

const counter = {
    callsThisMinute: 0,
    resetAt: Date.now() + 60000 // 1 minute from now
};

const canCallGemini = () => {
    const now = Date.now();
    
    // Reset counter if a minute has passed
    if (now >= counter.resetAt) {
        counter.callsThisMinute = 0;
        counter.resetAt = now + 60000;
    }

    // Gemini 1.5 Flash free tier limits to 15 RPM. Leave 1 buffer.
    if (counter.callsThisMinute >= 14) {
        return false;
    }
    
    return true;
};

const recordGeminiCall = () => {
    counter.callsThisMinute++;
};

module.exports = {
    canCallGemini,
    recordGeminiCall
};
