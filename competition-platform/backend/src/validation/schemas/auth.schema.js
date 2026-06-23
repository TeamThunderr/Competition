const { z } = require('zod');

/**
 * loginSchema
 * Used on: POST /api/auth/login
 */
const loginSchema = z.object({
  email:    z.string().email({ message: 'Must be a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

module.exports = { loginSchema };
