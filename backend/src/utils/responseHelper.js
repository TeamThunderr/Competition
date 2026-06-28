// File Name: responseHelper.js
// Purpose: Standardize API responses
// Written for beginner developers

const formatDatesInPayload = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
        // Match ISO 8601 strings that have time component
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|\+00:00)$/;
        if (isoRegex.test(obj)) {
            const d = new Date(obj);
            if (!isNaN(d.getTime())) {
                const istMs = d.getTime() + (5.5 * 60 * 60 * 1000);
                return new Date(istMs).toISOString().replace('Z', '+05:30');
            }
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => formatDatesInPayload(item));
    }
    if (typeof obj === 'object') {
        if (obj instanceof Date) {
            if (isNaN(obj.getTime())) return obj;
            const istMs = obj.getTime() + (5.5 * 60 * 60 * 1000);
            return new Date(istMs).toISOString().replace('Z', '+05:30');
        }
        const newObj = {};
        for (const key in obj) {
            newObj[key] = formatDatesInPayload(obj[key]);
        }
        return newObj;
    }
    return obj;
};

const sendResponse = (res, statusCode, data, message = 'Success') => {
    const isSuccess = statusCode < 400;
    res.status(statusCode).json({
        status: isSuccess ? 'success' : 'error',
        success: isSuccess,
        message,
        data: formatDatesInPayload(data)
    });
};

const sendSuccess = (res, data, message = 'Success') => {
    sendResponse(res, 200, data, message);
};

const sendError = (res, statusCode, message = 'Error') => {
    sendResponse(res, statusCode, null, message);
};

module.exports = { sendResponse, sendSuccess, sendError };
