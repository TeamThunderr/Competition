// File Name: authMiddleware.js
// Purpose: Verify Supabase JWT on every protected route
//
// Single unified flow — works the same in development and production.
// No more x-user-id header (spoofable). No more env branching.
//
// How it works:
//   1. Extract Bearer token from Authorization header
//   2. Verify JWT signature using SUPABASE_JWT_SECRET
//   3. Look up user in the custom `users` table by email (case-insensitive)
//   4. Attach user to req.user and proceed

const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

const authMiddleware = async (req, res, next) => {
    try {
        // ── 1. Extract token ──────────────────────────────────────────────────
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided. Please log in.',
            });
        }

        const token = authHeader.split(' ')[1];

        // ── 2. Verify JWT signature & expiry ──────────────────────────────────
        let payload;
        try {
            payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
                algorithms: ['HS256'],
            });
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Session expired. Please log in again.',
                });
            }
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token. Please log in again.',
            });
        }

        // ── 3. Extract email from token ───────────────────────────────────────
        const userEmail = payload.email?.trim().toLowerCase();

        if (!userEmail) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token is missing email claim.',
            });
        }

        // ── 4. Look up user in our DB (case-insensitive email match) ──────────
        const { data: user, error: dbError } = await supabase
            .from('users')
            .select('id, role, department_id, assigned_sections, email')
            .eq('email', userEmail)
            .maybeSingle();

        if (dbError || !user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found in the system.',
            });
        }

        // ── 5. Attach user context to request ─────────────────────────────────
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        console.error('[AuthMiddleware] Unexpected error:', error);
        return res.status(500).json({ message: 'Internal Server Error in Auth Middleware' });
    }
};

module.exports = authMiddleware;
