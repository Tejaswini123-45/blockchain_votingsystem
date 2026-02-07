/**
 * Response Utilities
 * @description Standardized API response helpers
 * @version 1.0.0
 */

/**
 * Create standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code for client handling
 * @param {Object} details - Additional error details
 */
exports.errorResponse = (res, statusCode, message, code = 'ERROR', details = null) => {
  const response = {
    success: false,
    message,
    code,
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create standardized success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
exports.successResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

/**
 * Simplified error response helper
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 */
exports.sendError = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code: 'INTERNAL_ERROR',
  });
};

/**
 * Simplified success response helper
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default 200)
 */
exports.sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
};
