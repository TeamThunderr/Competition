const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { error: "Too many requests", message: "Please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: "Too many login attempts", message: "Try again in 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false
});

const gmailSyncLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3,
    message: { error: "Sync rate limit", message: "Gmail sync allowed 3 times per 5 minutes" },
    standardHeaders: true,
    legacyHeaders: false
});

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
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
