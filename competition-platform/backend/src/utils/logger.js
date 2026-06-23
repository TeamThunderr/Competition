const winstonLogger = require('../config/logger');

const loggerMiddleware = (req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        const logMessage = `${method} ${url} ${status} - ${duration}ms`;

        if (status >= 500) {
            winstonLogger.error(logMessage);
        } else if (status >= 400) {
            winstonLogger.warn(logMessage);
        } else {
            winstonLogger.info(logMessage);
        }
    });

    next();
};

// Keep existing exports for backward compatibility
loggerMiddleware.info = winstonLogger.info;
loggerMiddleware.warn = winstonLogger.warn;
loggerMiddleware.error = winstonLogger.error;
loggerMiddleware.debug = winstonLogger.debug;

module.exports = loggerMiddleware;
