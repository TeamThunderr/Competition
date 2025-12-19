// File Name: logger.js
// Purpose: Simple console logger
// Written for beginner developers

const logger = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
};

module.exports = logger;
