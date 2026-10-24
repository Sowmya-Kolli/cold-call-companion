// src/middleware/errorHandler.js
// Central error handler — ensures no stack traces or secrets
// leak into responses.

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  // Log internally (server side only)
  console.error(`[ERROR] ${req.method} ${req.path} → ${status}:`, err.message);
  if (isDev) console.error(err.stack);

  res.status(status).json({
    error: {
      message: err.message || 'An unexpected error occurred.',
      // In production, hide stack traces entirely
      ...(isDev && err.stack ? { stack: err.stack } : {}),
    },
  });
}

// Convenience: create an HTTP error with a given status code
export function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}
