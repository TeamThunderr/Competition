// File Name: errorHandler.js
// Purpose: Global error handler using standardized response helper
// Written for beginner developers

const { sendError } = require('./responseHelper');

const errorHandler = (err, req, res, next) => {
    // Log the full stack trace for debugging
    console.error(err.stack);

    // Determine status code (default to 500)
    const statusCode = err.statusCode || 500;

    // Determine error message
    const message = err.message || 'Internal Server Error';

    // Send standardized error response
    sendError(res, statusCode, message);
};

module.exports = errorHandler;
