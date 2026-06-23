const { ZodError } = require('zod');

/**
 * validate(schema)
 * Returns an Express middleware that validates req.body against the given Zod schema.
 *
 * On failure → 422 Unprocessable Entity with a structured issues array.
 * On success → calls next() and lets the request continue to the controller.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Map Zod's flat issues list into { field, message } pairs.
    // issue.path is an array like ['email'] or ['team', 0, 'name'].
    // We join with '.' so nested paths are human-readable.
    const issues = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));

    return res.status(422).json({
      error: 'Validation Error',
      issues,
    });
  }

  // Replace req.body with the parsed (and coerced) value so downstream
  // controllers always receive clean, typed data.
  req.body = result.data;
  next();
};

module.exports = validate;
