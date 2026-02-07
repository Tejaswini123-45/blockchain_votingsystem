/**
 * OTP Controller
 * @description Handles OTP generation, sending, and verification
 * @version 1.0.0
 */

const Otp = require('../models/Otp.model');
const User = require('../models/User.model');
const { sendOTPEmail } = require('../config/email');
const { errorResponse, successResponse } = require('../utils/response');

// =============================================================================
// CONTROLLER METHODS
// =============================================================================

/**
 * Send OTP for registration
 * @route POST /api/auth/otp/send
 * @access Public
 * 
 * @body {
 *   "userId": "STU001",
 *   "email": "student@college.edu",
 *   "name": "John Doe"
 * }
 */
exports.sendRegistrationOTP = async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    // Validate required fields
    if (!userId || !email || !name) {
      return errorResponse(res, 400, 'User ID, email, and name are required', 'MISSING_FIELDS');
    }

    // Check if user already exists
    const existingUser = await User.findByUserId(userId);
    if (existingUser) {
      return errorResponse(res, 400, 'User ID already registered', 'USER_EXISTS');
    }

    // Check if email already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return errorResponse(res, 400, 'Email already registered', 'EMAIL_EXISTS');
    }

    // Check resend cooldown
    const cooldown = await Otp.getResendCooldown(userId, 'registration');
    if (cooldown > 0) {
      return errorResponse(res, 429, `Please wait ${cooldown} seconds before requesting another OTP`, 'COOLDOWN_ACTIVE');
    }

    // Generate and save OTP
    const { otp } = await Otp.createOTP(userId, email, 'registration');

    // Send OTP email
    await sendOTPEmail(email, name, otp, 'registration');

    return successResponse(res, 200, 'OTP sent successfully', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    return errorResponse(res, 500, error.message || 'Failed to send OTP', 'OTP_SEND_FAILED');
  }
};

/**
 * Verify OTP for registration
 * @route POST /api/auth/otp/verify
 * @access Public
 * 
 * @body {
 *   "userId": "STU001",
 *   "otp": "123456"
 * }
 */
exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Validate required fields
    if (!userId || !otp) {
      return errorResponse(res, 400, 'User ID and OTP are required', 'MISSING_FIELDS');
    }

    // Verify OTP
    const result = await Otp.verifyOTP(userId, otp, 'registration');

    if (!result.success) {
      return errorResponse(res, 400, result.message, result.code);
    }

    return successResponse(res, 200, 'OTP verified successfully', {
      emailVerified: true,
      email: result.email,
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return errorResponse(res, 500, 'Failed to verify OTP', 'OTP_VERIFY_FAILED');
  }
};

/**
 * Resend OTP
 * @route POST /api/auth/otp/resend
 * @access Public
 * 
 * @body {
 *   "userId": "STU001",
 *   "email": "student@college.edu",
 *   "name": "John Doe",
 *   "purpose": "registration"
 * }
 */
exports.resendOTP = async (req, res) => {
  try {
    const { userId, email, name, purpose = 'registration' } = req.body;

    // Validate required fields
    if (!userId || !email || !name) {
      return errorResponse(res, 400, 'User ID, email, and name are required', 'MISSING_FIELDS');
    }

    // Check resend cooldown
    const cooldown = await Otp.getResendCooldown(userId, purpose);
    if (cooldown > 0) {
      return errorResponse(res, 429, `Please wait ${cooldown} seconds before requesting another OTP`, 'COOLDOWN_ACTIVE');
    }

    // Generate and save new OTP
    const { otp } = await Otp.createOTP(userId, email, purpose);

    // Send OTP email
    await sendOTPEmail(email, name, otp, purpose);

    return successResponse(res, 200, 'OTP resent successfully', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    return errorResponse(res, 500, 'Failed to resend OTP', 'OTP_RESEND_FAILED');
  }
};

/**
 * Send OTP for login (existing user)
 * @route POST /api/auth/otp/login
 * @access Public
 * 
 * @body {
 *   "userId": "STU001"
 * }
 */
exports.sendLoginOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate required fields
    if (!userId) {
      return errorResponse(res, 400, 'User ID is required', 'MISSING_FIELDS');
    }

    // Find user
    const user = await User.findByUserId(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    // Check resend cooldown
    const cooldown = await Otp.getResendCooldown(userId, 'login');
    if (cooldown > 0) {
      return errorResponse(res, 429, `Please wait ${cooldown} seconds before requesting another OTP`, 'COOLDOWN_ACTIVE');
    }

    // Generate and save OTP
    const { otp } = await Otp.createOTP(userId, user.email, 'login');

    // Send OTP email
    await sendOTPEmail(user.email, user.name, otp, 'login');

    return successResponse(res, 200, 'OTP sent successfully', {
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('❌ Send Login OTP error:', error);
    return errorResponse(res, 500, 'Failed to send OTP', 'OTP_SEND_FAILED');
  }
};

/**
 * Send OTP for password reset
 * @route POST /api/auth/otp/password-reset
 * @access Public
 * 
 * @body {
 *   "userId": "STU001"
 * }
 */
exports.sendPasswordResetOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate required fields
    if (!userId) {
      return errorResponse(res, 400, 'User ID is required', 'MISSING_FIELDS');
    }

    // Find user
    const user = await User.findByUserId(userId);
    if (!user) {
      // Don't reveal if user exists
      return successResponse(res, 200, 'If the user exists, an OTP will be sent');
    }

    // Check resend cooldown
    const cooldown = await Otp.getResendCooldown(userId, 'password-reset');
    if (cooldown > 0) {
      return errorResponse(res, 429, `Please wait ${cooldown} seconds before requesting another OTP`, 'COOLDOWN_ACTIVE');
    }

    // Generate and save OTP
    const { otp } = await Otp.createOTP(userId, user.email, 'password-reset');

    // Send OTP email
    await sendOTPEmail(user.email, user.name, otp, 'password-reset');

    return successResponse(res, 200, 'OTP sent successfully', {
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('❌ Send Password Reset OTP error:', error);
    return errorResponse(res, 500, 'Failed to send OTP', 'OTP_SEND_FAILED');
  }
};

/**
 * Verify password reset OTP and reset password
 * @route POST /api/auth/otp/reset-password
 * @access Public
 * 
 * @body {
 *   "userId": "STU001",
 *   "otp": "123456",
 *   "newPassword": "newSecurePassword"
 * }
 */
exports.verifyAndResetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    // Validate required fields
    if (!userId || !otp || !newPassword) {
      return errorResponse(res, 400, 'User ID, OTP, and new password are required', 'MISSING_FIELDS');
    }

    // Verify OTP
    const result = await Otp.verifyOTP(userId, otp, 'password-reset');
    if (!result.success) {
      return errorResponse(res, 400, result.message, result.code);
    }

    // Find and update user password
    const user = await User.findByUserIdWithPassword(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    console.error('❌ Reset Password error:', error);
    return errorResponse(res, 500, 'Failed to reset password', 'RESET_FAILED');
  }
};
