/**
 * Auth Middleware
 * @description JWT authentication and authorization middleware
 * @author Senior MERN Developer
 */

const jwt = require('jsonwebtoken');
const Student = require('../models/Student.model');

/**
 * Protect routes - Verify JWT token
 * @middleware
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find student and attach to request
      const student = await Student.findById(decoded.id);

      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Student not found. Token is invalid.',
          code: 'INVALID_TOKEN',
        });
      }

      if (!student.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.',
          code: 'ACCOUNT_DEACTIVATED',
        });
      }

      // Attach student to request object
      req.student = {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        role: student.role,
        hasVoted: student.hasVoted,
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.',
          code: 'INVALID_TOKEN',
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};

/**
 * Authorize by role - Check if user has required role
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.student) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Not authenticated.',
        code: 'NOT_AUTHENTICATED',
      });
    }

    if (!roles.includes(req.student.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.student.role}' is not authorized to access this resource.`,
        code: 'FORBIDDEN',
        requiredRoles: roles,
      });
    }

    next();
  };
};

/**
 * Check if student has voted
 * @middleware
 */
exports.checkNotVoted = (req, res, next) => {
  if (req.student.hasVoted) {
    return res.status(403).json({
      success: false,
      message: 'You have already voted.',
      code: 'ALREADY_VOTED',
    });
  }

  next();
};

/**
 * Optional auth - Attach user if token exists, but don't require it
 * @middleware
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const student = await Student.findById(decoded.id);

        if (student && student.isActive) {
          req.student = {
            id: student._id,
            studentId: student.studentId,
            name: student.name,
            email: student.email,
            department: student.department,
            year: student.year,
            role: student.role,
            hasVoted: student.hasVoted,
          };
        }
      } catch (error) {
        // Token invalid, continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};
