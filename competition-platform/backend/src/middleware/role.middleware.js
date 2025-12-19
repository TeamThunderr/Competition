// File Name: role.middleware.js
// Purpose: Restrict access to routes based on user roles
// Written for beginner developers

const supabase = require('../config/supabaseClient');

// Middleware to check if the user has the required role
const checkRole = (requiredRoles) => {
    return async (req, res, next) => {
        try {
            // 1. Get the UID from the request body or headers
            // In a real app, you'd use a JWT token and verify it.
            // For simplicity here, we assume the frontend sends 'uid' in the body or we used auth middleware.
            // Let's assume an 'authMiddleware' ran before this and attached 'req.user'.

            // However, since we haven't built full JWT auth yet, let's fetch the user from Supabase using the UID sent in headers.
            const uid = req.headers['x-user-id'];

            if (!uid) {
                return res.status(401).json({ error: 'Unauthorized: No User ID provided' });
            }

            // 2. Fetch the user's role from our 'users' table
            const { data: user, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', uid)
                .single();

            if (error || !user) {
                return res.status(401).json({ error: 'Unauthorized: User not found' });
            }

            // 3. Check if the user's role is allowed
            // requiredRoles can be a single string 'ADMIN' or an array ['ADMIN', 'FACULTY']
            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

            if (!roles.includes(user.role)) {
                return res.status(403).json({ error: `Forbidden: Requires ${roles.join(' or ')} role` });
            }

            // 4. Attach role to request for next steps
            req.userRole = user.role;
            req.userId = uid;

            next(); // Move to the next function (controller)
        } catch (err) {
            console.error('Role check error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};

module.exports = checkRole;
