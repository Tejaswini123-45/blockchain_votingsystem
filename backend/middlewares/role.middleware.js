/**
 * Role-Based Authorization Middleware
 * @description Restricts access based on user roles (student, admin)
 * @version 2.0.0
 * @author Production Auth System
 */

const { ROLES } = require('../utils/constants');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create standardized authorization error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code for client handling
 */
const authzError = (res, message, code) => {
  return res.status(403).json({
    success: false,
    message,
    code,
  });
};

/**
 * Check if user is authenticated (has req.user)
 * @param {Object} req - Express request object
 * @returns {boolean}
 */
const isAuthenticated = (req) => {
  return req.user && req.user.id && req.user.role;
};

// =============================================================================
// ROLE MIDDLEWARE FUNCTIONS
// =============================================================================

/**
 * Allow only students to access the route
 * @middleware
 * 
 * @description
 * Checks if the authenticated user has 'student' role.
 * Must be used AFTER verifyToken middleware.
 * 
 * @example Usage:
 * router.post('/vote', verifyToken, allowStudent, voteController.castVote);
 * 
 * @example Error Response (403):
 * {
 *   "success": false,
 *   "message": "Access denied. Students only.",
 *   "code": "STUDENTS_ONLY"
 * }
 */
exports.allowStudent = (req, res, next) => {
  // Check authentication
  if (!isAuthenticated(req)) {
    return authzError(res, 'Authentication required', 'NOT_AUTHENTICATED');
  }

  // Check role
  if (req.user.role !== ROLES.STUDENT) {
    return authzError(res, 'Access denied. Students only.', 'STUDENTS_ONLY');
  }

  next();
};

/**
 * Allow only admins to access the route
 * @middleware
 * 
 * @description
 * Checks if the authenticated user has 'admin' role.
 * Must be used AFTER verifyToken middleware.
 * 
 * @example Usage:
 * router.get('/admin/dashboard', verifyToken, allowAdmin, adminController.getDashboard);
 * router.post('/admin/register', verifyToken, allowAdmin, authController.register);
 * 
 * @example Error Response (403):
 * {
 *   "success": false,
 *   "message": "Access denied. Admins only.",
 *   "code": "ADMINS_ONLY"
 * }
 */
exports.allowAdmin = (req, res, next) => {
  // Check authentication
  if (!isAuthenticated(req)) {
    return authzError(res, 'Authentication required', 'NOT_AUTHENTICATED');
  }

  // Check role
  if (req.user.role !== ROLES.ADMIN) {
    return authzError(res, 'Access denied. Admins only.', 'ADMINS_ONLY');
  }

  next();
};

/**
 * Allow multiple roles to access the route
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 * @middleware
 * 
 * @description
 * Creates a middleware that allows access to users with any of the specified roles.
 * Must be used AFTER verifyToken middleware.
 * 
 * @example Usage:
 * // Allow both students and admins
 * router.get('/profile', verifyToken, allowRoles('student', 'admin'), getProfile);
 * 
 * // Allow only specific roles
 * router.get('/special', verifyToken, allowRoles('admin'), specialHandler);
 */
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    // Check authentication
    if (!isAuthenticated(req)) {
      return authzError(res, 'Authentication required', 'NOT_AUTHENTICATED');
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return authzError(
        res,
        `Access denied. Required role: ${roles.join(' or ')}`,
        'INSUFFICIENT_ROLE'
      );
    }

    next();
  };
};

/**
 * Check if student has already voted
 * @middleware
 * 
 * @description
 * Prevents students who have already voted from voting again.
 * Must be used AFTER verifyToken and allowStudent middlewares.
 * 
 * @example Usage:
 * router.post('/vote', verifyToken, allowStudent, hasNotVoted, voteController.castVote);
 * 
 * @example Error Response (403):
 * {
 *   "success": false,
 *   "message": "You have already voted",
 *   "code": "ALREADY_VOTED"
 * }
 */
exports.hasNotVoted = (req, res, next) => {
  // Check authentication
  if (!isAuthenticated(req)) {
    return authzError(res, 'Authentication required', 'NOT_AUTHENTICATED');
  }

  // Check if already voted
  if (req.user.hasVoted === true) {
    return authzError(res, 'You have already voted', 'ALREADY_VOTED');
  }

  next();
};

/**
 * Check if student has voted (for viewing results)
 * @middleware
 * 
 * @description
 * Only allows students who have voted to view results.
 * Must be used AFTER verifyToken middleware.
 * 
 * @example Usage:
 * router.get('/results', verifyToken, hasVoted, resultsController.getResults);
 */
exports.hasVoted = (req, res, next) => {
  // Check authentication
  if (!isAuthenticated(req)) {
    return authzError(res, 'Authentication required', 'NOT_AUTHENTICATED');
  }

  // Admins can always view results
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  // Check if student has voted
  if (req.user.hasVoted !== true) {
    return authzError(res, 'You must vote first to view results', 'VOTING_REQUIRED');
  }

  next();
};

// =============================================================================
// EXPORT CONSTANTS
// =============================================================================

exports.ROLES = ROLES;
