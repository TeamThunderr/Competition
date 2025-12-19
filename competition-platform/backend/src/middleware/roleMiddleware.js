// File Name: roleMiddleware.js
// Purpose: Check user permissions
// Written for beginner developers

const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        if (req.user && req.user.role === requiredRole) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
    };
};

module.exports = roleMiddleware;
