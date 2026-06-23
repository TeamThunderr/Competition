/**
 * applyPagination(query, pagination)
 *
 * Chains a Supabase `.range()` call onto an existing query builder.
 * The query must already have `.select('*', { count: 'exact' })` so that
 * Supabase returns the full `count` alongside the paged data.
 *
 * @param {object} query      - A Supabase query builder instance (not yet awaited).
 * @param {object} pagination - The req.pagination object from the paginate middleware.
 * @returns {object}          - The same query with .range() applied.
 */
const applyPagination = (query, pagination) => {
  const { offset, limit } = pagination;
  return query.range(offset, offset + limit - 1);
};

/**
 * paginatedResponse(data, pagination, total)
 *
 * Wraps data + pagination metadata into a standard response envelope.
 *
 * @param {Array}  data       - The page of records returned from Supabase.
 * @param {object} pagination - The req.pagination object from the paginate middleware.
 * @param {number} total      - The exact total count returned by Supabase (count field).
 * @returns {object}          - Standardised paginated response.
 */
const paginatedResponse = (data, pagination, total) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

module.exports = { applyPagination, paginatedResponse };
