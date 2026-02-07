/**
 * OTP Model
 * @description Stores temporary OTPs for email verification with auto-expiry
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    trim: true,
    uppercase: true,
    index: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'password-reset', 'email-change'],
    default: 'registration',
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5, // Max verification attempts
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Auto-delete after 10 minutes (TTL index)
  },
});

// =============================================================================
// INDEXES
// =============================================================================

// Compound index for quick lookup
otpSchema.index({ userId: 1, purpose: 1 });

// Note: TTL index is already created via 'expires' option in createdAt field

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
otpSchema.statics.generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and save a new OTP for a user
 * @param {string} userId - Student/Admin ID
 * @param {string} email - User's email
 * @param {string} purpose - OTP purpose
 * @returns {Promise<Object>} - Created OTP document
 */
otpSchema.statics.createOTP = async function (userId, email, purpose = 'registration') {
  // Delete any existing OTPs for this user and purpose
  await this.deleteMany({ userId: userId.toUpperCase(), purpose });

  const otp = this.generateOTP();
  
  const otpDoc = await this.create({
    userId: userId.toUpperCase(),
    email: email.toLowerCase(),
    otp,
    purpose,
  });

  return { otp, otpDoc };
};

/**
 * Verify an OTP
 * @param {string} userId - Student/Admin ID
 * @param {string} otp - OTP to verify
 * @param {string} purpose - OTP purpose
 * @returns {Promise<Object>} - Verification result
 */
otpSchema.statics.verifyOTP = async function (userId, otp, purpose = 'registration') {
  const otpDoc = await this.findOne({
    userId: userId.toUpperCase(),
    purpose,
  });

  if (!otpDoc) {
    return { success: false, message: 'OTP expired or not found', code: 'OTP_NOT_FOUND' };
  }

  // Check max attempts
  if (otpDoc.attempts >= 5) {
    await this.deleteOne({ _id: otpDoc._id });
    return { success: false, message: 'Too many attempts. Please request a new OTP', code: 'MAX_ATTEMPTS' };
  }

  // Increment attempts
  otpDoc.attempts += 1;
  await otpDoc.save();

  // Verify OTP
  if (otpDoc.otp !== otp) {
    return { 
      success: false, 
      message: `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining`, 
      code: 'INVALID_OTP',
      attemptsRemaining: 5 - otpDoc.attempts,
    };
  }

  // Mark as verified and delete
  await this.deleteOne({ _id: otpDoc._id });

  return { 
    success: true, 
    message: 'OTP verified successfully',
    email: otpDoc.email,
  };
};

/**
 * Check if user has a pending OTP
 * @param {string} userId - Student/Admin ID
 * @param {string} purpose - OTP purpose
 * @returns {Promise<boolean>}
 */
otpSchema.statics.hasPendingOTP = async function (userId, purpose = 'registration') {
  const count = await this.countDocuments({
    userId: userId.toUpperCase(),
    purpose,
  });
  return count > 0;
};

/**
 * Get time until OTP can be resent (rate limiting)
 * @param {string} userId - Student/Admin ID
 * @param {string} purpose - OTP purpose
 * @returns {Promise<number>} - Seconds until resend allowed (0 if allowed)
 */
otpSchema.statics.getResendCooldown = async function (userId, purpose = 'registration') {
  const otpDoc = await this.findOne({
    userId: userId.toUpperCase(),
    purpose,
  });

  if (!otpDoc) return 0;

  const cooldownSeconds = 60; // 1 minute cooldown
  const elapsed = (Date.now() - otpDoc.createdAt.getTime()) / 1000;
  const remaining = cooldownSeconds - elapsed;

  return remaining > 0 ? Math.ceil(remaining) : 0;
};

module.exports = mongoose.model('Otp', otpSchema);
