const { z } = require('zod');

/**
 * createCompetitionSchema
 * Used on: POST /api/admin/competition
 */
const createCompetitionSchema = z.object({
  title:                 z.string().min(3,  { message: 'title must be at least 3 characters' }),
  organizer:             z.string().min(2,  { message: 'organizer must be at least 2 characters' }),
  platform:              z.string().optional(),
  registration_deadline: z.string().datetime({ message: 'registration_deadline must be a valid ISO 8601 datetime' }),
  event_date:            z.string().datetime({ message: 'event_date must be a valid ISO 8601 datetime' }),
  team_allowed:          z.boolean({ required_error: 'team_allowed is required' }),
  min_team_size:         z.number().int().min(1).optional(),
  max_team_size:         z.number().int().min(1).optional(),
  departments:           z.array(z.string()).optional(),
});

/**
 * updateCompetitionSchema
 * Used on: PUT /api/admin/competition/:id
 * All fields are optional — only the supplied fields are validated/updated.
 */
const updateCompetitionSchema = createCompetitionSchema.partial();

module.exports = { createCompetitionSchema, updateCompetitionSchema };
