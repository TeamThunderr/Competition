const DEFAULT_RPM = Number(process.env.GMAIL_REQUESTS_PER_MINUTE || 120);

const state = {
    callsThisMinute: 0,
    resetAt: Date.now() + 60000
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForGmailSlot = async () => {
    const rpm = Math.max(Number(process.env.GMAIL_REQUESTS_PER_MINUTE || DEFAULT_RPM), 1);

    while (true) {
        const now = Date.now();
        if (now >= state.resetAt) {
            state.callsThisMinute = 0;
            state.resetAt = now + 60000;
        }

        if (state.callsThisMinute < rpm) {
            state.callsThisMinute++;
            return;
        }

        await sleep(Math.max(state.resetAt - now, 1000));
    }
};

module.exports = { waitForGmailSlot };
