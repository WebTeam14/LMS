/**
 * Generic Zod validation middleware for Express routes.
 * Supports both object schema mapping ({ body, query, params })
 * and direct Zod schema (defaults to body or optional source).
 *
 * @param {Object | import('zod').ZodSchema} schemas
 * @param {'body' | 'query' | 'params'} [source='body']
 * @returns {import('express').RequestHandler}
 */
export const validate = (schemas, source = 'body') => async (req, res, next) => {
  try {
    if (schemas && typeof schemas.parseAsync === 'function') {
      req[source] = await schemas.parseAsync(req[source]);
      return next();
    }

    if (schemas.body) {
      req.body = await schemas.body.parseAsync(req.body);
    }
    if (schemas.query) {
      req.query = await schemas.query.parseAsync(req.query);
    }
    if (schemas.params) {
      req.params = await schemas.params.parseAsync(req.params);
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

export default validate;
