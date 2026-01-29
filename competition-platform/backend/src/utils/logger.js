// File Name: logger.js
// Purpose: Enhanced console logger with duration and status colors
// Written for beginner developers

const logger = (req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    // Log request start
    // console.log(`${new Date().toISOString()} - ${method} ${url} - Started`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        // Color coding for status
        let logMessage = `${new Date().toISOString()} - ${method} ${url} ${status} - ${duration}ms`;

        if (status >= 500) {
            console.error('\x1b[31m%s\x1b[0m', logMessage); // Red
        } else if (status >= 400) {
            console.warn('\x1b[33m%s\x1b[0m', logMessage); // Yellow
        } else {
            console.log('\x1b[32m%s\x1b[0m', logMessage); // Green
        }
    });

    next();
};

module.exports = logger;
