/**
 * Generic Zod validation middleware for Express routes.
 *
 * @param {Object} schemas - Schema mapping
 * @param {import('zod').ZodSchema} [schemas.body] - Zod schema for req.body
 * @param {import('zod').ZodSchema} [schemas.query] - Zod schema for req.query
 * @param {import('zod').ZodSchema} [schemas.params] - Zod schema for req.params
 * @returns {import('express').RequestHandler}
 */
export const validate = (schemas) => async (req, res, next) => {
  try {
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
