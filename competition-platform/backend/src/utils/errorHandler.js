// File Name: errorHandler.js
// Purpose: Global error handler
// Written for beginner developers

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: err.message
    });
};

module.exports = errorHandler;
