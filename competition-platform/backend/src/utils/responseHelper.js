// File Name: responseHelper.js
// Purpose: Standardize API responses
// Written for beginner developers

const sendResponse = (res, statusCode, data, message = 'Success') => {
    res.status(statusCode).json({
        status: statusCode < 400 ? 'success' : 'error',
        message,
        data
    });
};

module.exports = { sendResponse };
