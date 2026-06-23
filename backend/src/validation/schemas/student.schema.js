const { z } = require('zod');

/**
 * uploadProofSchema
 * Used on: POST /api/student/upload-proof
 * Note: The proof file itself is handled by Multer (multipart/form-data).
 *       This schema validates the non-file fields sent alongside the upload.
 */
const uploadProofSchema = z.object({
  competition_id: z.string().uuid({ message: 'competition_id must be a valid UUID' }),
  notes:          z.string().optional(),
});

/**
 * requestOdSchema
 * Used on: POST /api/student/request-od
 */
const requestOdSchema = z.object({
  competition_id: z.string().uuid({ message: 'competition_id must be a valid UUID' }),
  reason:         z.string().min(10, { message: 'Reason must be at least 10 characters' }),
  time_slot:      z.string({ required_error: 'time_slot is required' }),
});

module.exports = { uploadProofSchema, requestOdSchema };
