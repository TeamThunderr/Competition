// File Name: responseHelper.js
// Purpose: Standardize API responses
// Written for beginner developers

const sendResponse = (res, statusCode, data, message = 'Success') => {
    const isSuccess = statusCode < 400;
    res.status(statusCode).json({
        status: isSuccess ? 'success' : 'error',
        success: isSuccess,
        message,
        data
    });
};

const sendSuccess = (res, data, message = 'Success') => {
    sendResponse(res, 200, data, message);
};

const sendError = (res, statusCode, message = 'Error') => {
    sendResponse(res, statusCode, null, message);
};

module.exports = { sendResponse, sendSuccess, sendError };
