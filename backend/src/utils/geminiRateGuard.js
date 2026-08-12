// File: geminiRateGuard.js

const counter = {
    callsThisMinute: 0,
    resetAt: Date.now() + 60000 // 1 minute from now
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const canCallGemini = () => {
    const now = Date.now();
    
    // Reset counter if a minute has passed
    if (now >= counter.resetAt) {
        counter.callsThisMinute = 0;
        counter.resetAt = now + 60000;
    }

    const rpmLimit = Math.max(Number(process.env.GEMINI_RPM_LIMIT || 14), 1);

    if (counter.callsThisMinute >= rpmLimit) {
        return false;
    }
    
    return true;
};

const recordGeminiCall = () => {
    counter.callsThisMinute++;
};

const waitForGeminiSlot = async () => {
    while (!canCallGemini()) {
        const waitMs = Math.max(counter.resetAt - Date.now(), 1000);
        await sleep(waitMs);
    }
    recordGeminiCall();
};

module.exports = {
    canCallGemini,
    recordGeminiCall,
    waitForGeminiSlot
};
