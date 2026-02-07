/**
 * JWT Authentication Middleware
 * @description Verifies JWT tokens and attaches user info to request
 * @version 2.0.0
 * @author Production Auth System
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// =============================================================================
// CONSTANTS
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_PREFIX = 'Bearer';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract token from request
 * Priority: Authorization header > Cookie
 * @param {Object} req - Express request object
 * @returns {string|null} - JWT token or null
 */
const extractToken = (req) => {
  // Check Authorization header first (preferred method)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith(TOKEN_PREFIX)) {
    return authHeader.slice(TOKEN_PREFIX.length + 1); // Remove "Bearer "
  }

  // Fallback to cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

/**
 * Create standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code for client handling
 */
const authError = (res, statusCode, message, code) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};

// =============================================================================
// MIDDLEWARE FUNCTIONS
// =============================================================================

/**
 * Verify JWT token and attach user to request
 * @middleware
 * 
 * @description
 * This middleware:
 * 1. Extracts JWT from Authorization header or cookies
 * 2. Verifies the token signature and expiration
 * 3. Fetches the user from database
 * 4. Attaches user object to req.user
 * 
 * @example Usage in routes:
 * router.get('/protected', verifyToken, (req, res) => {
 *   console.log(req.user); // { id, userId, name, role, ... }
 * });
 * 
 * @example Request Header:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // ==========================================================
    // EXTRACT TOKEN
    // ==========================================================
    
    const token = extractToken(req);

    if (!token) {
      return authError(res, 401, 'Access denied. No token provided.', 'NO_TOKEN');
    }

    // ==========================================================
    // VERIFY TOKEN
    // ==========================================================

    if (!JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET not configured');
      return authError(res, 500, 'Server configuration error', 'CONFIG_ERROR');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'clg-voting-api',
        audience: 'clg-voting-client',
      });
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return authError(res, 401, 'Token has expired. Please login again.', 'TOKEN_EXPIRED');
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return authError(res, 401, 'Invalid token. Please login again.', 'INVALID_TOKEN');
      }
      if (jwtError.name === 'NotBeforeError') {
        return authError(res, 401, 'Token not yet valid.', 'TOKEN_NOT_ACTIVE');
      }
      throw jwtError;
    }

    // ==========================================================
    // FETCH USER FROM DATABASE
    // ==========================================================

    const user = await User.findById(decoded.id);

    if (!user) {
      return authError(res, 401, 'User not found. Token is invalid.', 'USER_NOT_FOUND');
    }

    // ==========================================================
    // ATTACH USER TO REQUEST
    // ==========================================================

    req.user = {
      id: user._id,
      odId: user._id.toString(),
      userId: user.userId,
      name: user.name,
      role: user.role,
      department: user.department,
      year: user.year,
      hasVoted: user.hasVoted,
    };

    // Also store the raw token for potential use
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return authError(res, 500, 'Authentication failed', 'AUTH_ERROR');
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that behave differently for authenticated users
 * @middleware
 * 
 * @example Usage:
 * router.get('/public', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // Authenticated user
 *   } else {
 *     // Guest user
 *   }
 * });
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    if (!JWT_SECRET) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'clg-voting-api',
        audience: 'clg-voting-client',
      });

      const user = await User.findById(decoded.id);

      if (user) {
        req.user = {
          id: user._id,
          odId: user._id.toString(),
          userId: user.userId,
          name: user.name,
          role: user.role,
          department: user.department,
          year: user.year,
          hasVoted: user.hasVoted,
        };
        req.token = token;
      } else {
        req.user = null;
      }
    } catch {
      // Token invalid, but that's okay for optional auth
      req.user = null;
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    req.user = null;
    next();
  }
};

/**
 * Refresh user data from database
 * Use after operations that modify user data
 * @middleware
 */
exports.refreshUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next();
    }

    const user = await User.findById(req.user.id);

    if (user) {
      req.user = {
        id: user._id,
        odId: user._id.toString(),
        userId: user.userId,
        name: user.name,
        role: user.role,
        department: user.department,
        year: user.year,
        hasVoted: user.hasVoted,
      };
    }

    next();
  } catch (error) {
    console.error('Refresh User Error:', error);
    next();
  }
};
