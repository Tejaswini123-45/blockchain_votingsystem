/**
 * KYC Routes
 * @description Routes for ID card upload and KYC verification
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Import controller
const kycController = require('../controllers/kyc.controller');

// Import middlewares
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowStudent, allowAdmin } = require('../middlewares/role.middleware');

// =============================================================================
// STUDENT ROUTES
// =============================================================================

/**
 * @route   POST /api/kyc/upload
 * @desc    Upload ID card for KYC verification
 * @access  Private (students only)
 * 
 * @form-data {
 *   idCard: File (image)
 * }
 */
router.post('/upload', verifyToken, allowStudent, kycController.uploadIdCardHandler);

/**
 * @route   GET /api/kyc/status
 * @desc    Get current user's KYC status
 * @access  Private
 */
router.get('/status', verifyToken, kycController.getKYCStatus);

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * @route   GET /api/kyc/pending
 * @desc    Get all pending KYC submissions
 * @access  Private (admin only)
 */
router.get('/pending', verifyToken, allowAdmin, kycController.getPendingKYC);

/**
 * @route   POST /api/kyc/approve/:userId
 * @desc    Approve a user's KYC
 * @access  Private (admin only)
 */
router.post('/approve/:userId', verifyToken, allowAdmin, kycController.approveKYC);

/**
 * @route   POST /api/kyc/reject/:userId
 * @desc    Reject a user's KYC
 * @access  Private (admin only)
 * 
 * @body {
 *   "reason": "ID card image is blurry"
 * }
 */
router.post('/reject/:userId', verifyToken, allowAdmin, kycController.rejectKYC);

/**
 * @route   GET /api/kyc/image/:userId
 * @desc    Get user's ID card image
 * @access  Private (admin only)
 */
router.get('/image/:userId', verifyToken, allowAdmin, kycController.getIdCardImage);

module.exports = router;
