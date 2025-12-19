// File Name: authMiddleware.js
// Purpose: Verify user authentication
// Written for beginner developers

const authMiddleware = (req, res, next) => {
    // TODO: Verify token from headers
    console.log('Checking authentication...');
    // Mock user for now
    req.user = { id: 1, role: 'student' };
    next();
};

module.exports = authMiddleware;
