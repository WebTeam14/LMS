export const successResponse = (res, data = null, meta = null, statusCode = 200) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const errorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  const body = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    },
  };
  if (error.details) body.error.details = error.details;
  return res.status(statusCode).json(body);
};
