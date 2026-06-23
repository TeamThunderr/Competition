const roleMiddleware = (requiredRoles) => {
    return (req, res, next) => {
        try {
            // 1. Check if user is authenticated (req.user should be set by authMiddleware)
            if (!req.user || !req.user.role) {
                console.log("Role Middleware - User missing from req");
                return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
            }

            // 2. Normalize requiredRoles to an array
            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
            console.log(`Role Middleware - Checking if ${req.user.role} is in [${roles.join(', ')}]`);

            // 3. Check if user has permission
            if (!roles.includes(req.user.role)) {
                console.log("Role Middleware - Access Denied");
                return res.status(403).json({
                    error: `Forbidden: Requires one of these roles: ${roles.join(', ')}`
                });
            }

            // 4. User has role, proceed
            next();
        } catch (err) {
            console.error('Role middleware error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};

module.exports = roleMiddleware;
