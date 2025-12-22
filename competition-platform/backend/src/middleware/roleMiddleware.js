// File Name: roleMiddleware.js
// Purpose: Protect routes based on User Role
// Written for beginner developers

const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        // Assume req.user is set by authMiddleware (JWT decoding)
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ message: "Unauthorized: No user role found" });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: "Forbidden: You do not have permission" });
        }

        next();
    };
};

module.exports = roleMiddleware;
