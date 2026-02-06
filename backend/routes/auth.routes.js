/**
 * Auth Routes
 * @description Authentication routes for student registration and login
 * @author Senior MERN Developer
 */

const express = require('express');
const router = express.Router();

// Import controller
const {
  register,
  login,
  getMe,
  logout,
  updatePassword,
} = require('../controllers/auth.controller');

// Import middleware
const { protect } = require('../middleware/auth.middleware');

/**
 * Public Routes
 */

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login student
// @access  Public
router.post('/login', login);

/**
 * Protected Routes (require authentication)
 */

// @route   GET /api/auth/me
// @desc    Get current logged in student
// @access  Private
router.get('/me', protect, getMe);

// @route   POST /api/auth/logout
// @desc    Logout student
// @access  Private
router.post('/logout', protect, logout);

// @route   PUT /api/auth/password
// @desc    Update password
// @access  Private
router.put('/password', protect, updatePassword);

module.exports = router;
