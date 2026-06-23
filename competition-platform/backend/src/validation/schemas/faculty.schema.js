const { z } = require('zod');

/**
 * verifyRegistrationSchema
 * Used on: POST /api/faculty/verify-registration
 */
const verifyRegistrationSchema = z.object({
  registration_id: z.string().uuid({ message: 'registration_id must be a valid UUID' }),
  action:          z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: "action must be either 'approve' or 'reject'" }),
  }),
  remarks: z.string().optional(),
});

module.exports = { verifyRegistrationSchema };
