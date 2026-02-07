/**
 * Authentication Routes
 * @description Clean auth routes with role-based access
 */

const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/auth.controller');
const otpController = require('../controllers/otp.controller');

// Middlewares
const { verifyToken, optionalAuth } = require('../middlewares/auth.middleware');
const { allowAdmin } = require('../middlewares/role.middleware');

// =============================================================================
// OTP ROUTES
// =============================================================================

// Send OTP for registration
router.post('/otp/send', otpController.sendRegistrationOTP);

// Verify OTP
router.post('/otp/verify', otpController.verifyRegistrationOTP);

// Resend OTP
router.post('/otp/resend', otpController.resendOTP);

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

// Register new student
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// =============================================================================
// PROTECTED ROUTES
// =============================================================================

// Get profile
router.get('/profile', verifyToken, authController.getProfile);
router.get('/me', verifyToken, authController.getProfile);

// Update password
router.put('/password', verifyToken, authController.updatePassword);

// Logout
router.post('/logout', verifyToken, (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Register new admin (admin only)
router.post('/admin/register', verifyToken, allowAdmin, authController.register);

// Get all users (admin only)
router.get('/admin/users', verifyToken, allowAdmin, authController.getAllUsers);

// Get voting stats (admin only)
router.get('/admin/stats', verifyToken, allowAdmin, authController.getVotingStats);

// =============================================================================
// VALIDATION
// =============================================================================

// Validate token
router.get('/validate', verifyToken, (req, res) => {
  res.status(200).json({ success: true, valid: true, user: req.user });
});

// Check auth status (optional)
router.get('/check', optionalAuth, (req, res) => {
  res.status(200).json({
    success: true,
    authenticated: !!req.user,
    user: req.user || null,
  });
});

module.exports = router;
