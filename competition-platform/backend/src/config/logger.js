const winston = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = combine(
    colorize(),
    printf(({ level, message }) => {
        return `[${level}] ${message}`;
    })
);

const fileFormat = combine(
    timestamp(),
    json()
);

const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
            format: process.env.NODE_ENV === 'production' ? json() : consoleFormat
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            level: 'error',
            format: fileFormat
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
            format: fileFormat
        })
    ]
});

// Named exports for backward compatibility
const { info, warn, error, debug } = logger;

module.exports = logger;
module.exports.info = info;
module.exports.warn = warn;
module.exports.error = error;
module.exports.debug = debug;
