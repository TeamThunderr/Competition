/**
 * paginate middleware
 *
 * Reads ?page=<n>&limit=<n> from query string and attaches a pagination object
 * to req.pagination for use in controllers.
 *
 * Defaults : page = 1, limit = 20
 * Maximum  : limit is capped at 100 to prevent runaway queries.
 *
 * req.pagination shape:
 *   { page: number, limit: number, offset: number }
 */
const paginate = (req, _res, next) => {
  const rawPage  = parseInt(req.query.page,  10);
  const rawLimit = parseInt(req.query.limit, 10);

  const page  = (!isNaN(rawPage)  && rawPage  > 0) ? rawPage  : 1;
  const limit = (!isNaN(rawLimit) && rawLimit > 0) ? Math.min(rawLimit, 100) : 20;

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
  };

  next();
};

module.exports = paginate;
