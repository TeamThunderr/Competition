const { z } = require('zod');

/**
 * loginSchema
 * Used on: POST /api/auth/login
 */
const loginSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address' }),
});

module.exports = { loginSchema };
