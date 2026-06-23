const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err.message, { stack: err.stack });

    const status = err.status || 500;

    res.status(status).json({
        error: err.name || "InternalServerError",
        message: err.message || "Something went wrong",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
