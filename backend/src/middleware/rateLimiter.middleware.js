const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Practically disabled
    message: { error: "Too many requests", message: "Please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Practically disabled
    message: { error: "Too many login attempts", message: "Try again in 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false
});

const gmailSyncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: Number(process.env.GMAIL_SYNC_RATE_LIMIT_MAX || 3),
    message: { error: "Sync rate limit", message: "Gmail sync allowed 3 times per 5 minutes" },
    standardHeaders: true,
    legacyHeaders: false
});

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Practically disabled
    message: { error: "Too many requests", message: "Please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    globalLimiter,
    authLimiter,
    gmailSyncLimiter,
    adminLimiter
};
