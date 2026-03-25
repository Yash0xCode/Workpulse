/**
 * Sorting Middleware
 * Extracts and validates sort parameters
 */

export const sortingMiddleware = (req, res, next) => {
  const sort = req.query.sort || '-created_at'; // Default: newest first
  const parts = sort.split(',');
  const order = [];

  parts.forEach(s => {
    const field = s.startsWith('-') ? s.substring(1) : s;
    const direction = s.startsWith('-') ? 'DESC' : 'ASC';
    order.push([field, direction]);
  });

  req.sorting = { sort, order };
  next();
};

export default sortingMiddleware;
