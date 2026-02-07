/**
 * Application Constants
 * @description Centralized constants for the application
 * @version 1.0.0
 */

// Valid departments for students
exports.VALID_DEPARTMENTS = [
  'CSE',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL',
  'IT',
  'AIDS',
  'AIML',
  'CSM',
];

// User roles
exports.ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

// KYC statuses
exports.KYC_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// OTP purposes
exports.OTP_PURPOSE = {
  REGISTRATION: 'registration',
  LOGIN: 'login',
  PASSWORD_RESET: 'password-reset',
  EMAIL_CHANGE: 'email-change',
};

// JWT configuration
exports.JWT_CONFIG = {
  EXPIRE: process.env.JWT_EXPIRE || '7d',
  ISSUER: 'clg-voting-api',
  AUDIENCE: 'clg-voting-client',
};

// File upload limits
exports.UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

// Rate limiting
exports.RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
  AUTH: {
    windowMs: 15 * 60 * 1000,
    max: 20,
  },
};

// OTP configuration
exports.OTP_CONFIG = {
  EXPIRY_SECONDS: 600, // 10 minutes
  RESEND_COOLDOWN_SECONDS: 60,
  MAX_ATTEMPTS: 5,
};
