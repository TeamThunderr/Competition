const { z } = require('zod');

/**
 * manageOdSchema
 * Used on: POST /api/hod/manage-od
 */
const manageOdSchema = z.object({
  od_request_id: z.string().uuid({ message: 'od_request_id must be a valid UUID' }),
  action:        z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: "action must be either 'APPROVED' or 'REJECTED'" }),
  }),
  approved_days: z.number().int().min(1).optional(),
});

module.exports = { manageOdSchema };
