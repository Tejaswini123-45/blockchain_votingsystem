/**
 * Authentication Controller
 * @description Handles user registration, login, and profile
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { errorResponse, successResponse } = require('../utils/response');
const { VALID_DEPARTMENTS, JWT_CONFIG } = require('../utils/constants');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generate JWT Token
 */
const generateToken = (payload) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_CONFIG.EXPIRE,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
  });
};

/**
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { userId, name, email, department, year, password, role = 'student' } = req.body;

    // Validate required fields
    if (!userId || !name || !email || !password) {
      return errorResponse(res, 400, 'Please provide userId, name, email, and password', 'MISSING_FIELDS');
    }

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return errorResponse(res, 400, 'Please provide a valid email address', 'INVALID_EMAIL');
    }

    // Check password strength
    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters', 'WEAK_PASSWORD');
    }

    // Validate role
    if (!['student', 'admin'].includes(role)) {
      return errorResponse(res, 400, 'Invalid role', 'INVALID_ROLE');
    }

    // Admin registration requires admin auth
    if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
      return errorResponse(res, 403, 'Only admins can register new admins', 'ADMIN_ONLY');
    }

    // Student-specific validation
    if (role === 'student') {
      if (!department || !VALID_DEPARTMENTS.includes(department.toUpperCase())) {
        return errorResponse(res, 400, `Invalid department. Valid: ${VALID_DEPARTMENTS.join(', ')}`, 'INVALID_DEPARTMENT');
      }
      if (!year || year < 1 || year > 4) {
        return errorResponse(res, 400, 'Year must be between 1 and 4', 'INVALID_YEAR');
      }
    }

    // Check duplicates
    const existingUser = await User.findByUserId(userId);
    if (existingUser) {
      return errorResponse(res, 409, 'User ID already exists', 'DUPLICATE_USER_ID');
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return errorResponse(res, 409, 'Email already registered', 'DUPLICATE_EMAIL');
    }

    // Create user
    const userData = {
      userId: userId.toUpperCase(),
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role,
      isVerified: role === 'admin',
    };

    if (role === 'student') {
      userData.department = department.toUpperCase();
      userData.year = parseInt(year, 10);
    }

    const user = await User.create(userData);

    const token = generateToken({
      id: user._id,
      userId: user.userId,
      role: user.role,
    });

    return successResponse(res, 201, 'Registration successful', { token, user: user.toJSON() });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.code === 11000) {
      return errorResponse(res, 409, 'User already exists', 'DUPLICATE_USER');
    }
    return errorResponse(res, 500, 'Registration failed', 'SERVER_ERROR');
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, userId, password } = req.body;

    // Accept either email or userId for login
    if ((!email && !userId) || !password) {
      return errorResponse(res, 400, 'Please provide email (or userId) and password', 'MISSING_CREDENTIALS');
    }

    // Find user by email or userId
    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    } else {
      user = await User.findByUserIdWithPassword(userId);
    }
    
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return errorResponse(res, 401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const token = generateToken({
      id: user._id,
      userId: user.userId,
      role: user.role,
    });

    return successResponse(res, 200, 'Login successful', { token, user: user.toJSON() });
  } catch (error) {
    console.error('Login Error:', error);
    return errorResponse(res, 500, 'Login failed', 'SERVER_ERROR');
  }
};

/**
 * GET /api/auth/me
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }
    return successResponse(res, 200, 'Profile retrieved', { user: user.toJSON() });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve profile', 'SERVER_ERROR');
  }
};

/**
 * PUT /api/auth/password
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, 'Please provide current and new password', 'MISSING_PASSWORDS');
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'New password must be at least 6 characters', 'WEAK_PASSWORD');
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, 'Current password is incorrect', 'INVALID_PASSWORD');
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, 'Password updated successfully');
  } catch (error) {
    console.error('Update Password Error:', error);
    return errorResponse(res, 500, 'Failed to update password', 'SERVER_ERROR');
  }
};

/**
 * GET /api/auth/admin/stats
 */
exports.getVotingStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const votedCount = await User.countDocuments({ role: 'student', hasVoted: true });
    const notVotedCount = totalStudents - votedCount;
    const votingPercentage = totalStudents > 0 ? Math.round((votedCount / totalStudents) * 100) : 0;

    return successResponse(res, 200, 'Statistics retrieved', {
      stats: { totalStudents, votedCount, notVotedCount, votingPercentage },
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve statistics', 'SERVER_ERROR');
  }
};

/**
 * GET /api/auth/admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query);

    return successResponse(res, 200, 'Users retrieved', {
      count: users.length,
      users: users.map((u) => u.toJSON()),
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve users', 'SERVER_ERROR');
  }
};
