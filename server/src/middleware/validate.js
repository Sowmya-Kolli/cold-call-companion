// src/middleware/validate.js
// Lightweight request validation helpers.

import { httpError } from './errorHandler.js';

/**
 * Returns middleware that validates required body fields.
 * @param {string[]} fields
 */
export function requireBody(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(
      (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
    );
    if (missing.length > 0) {
      return next(httpError(`Missing required fields: ${missing.join(', ')}`, 400));
    }
    next();
  };
}

/**
 * Validates :n route param is an integer between 1 and 8.
 */
export function validateStageParam(req, res, next) {
  const n = parseInt(req.params.n, 10);
  if (isNaN(n) || n < 1 || n > 8) {
    return next(httpError('Stage number must be an integer between 1 and 8.', 400));
  }
  req.stageNumber = n;
  next();
}
