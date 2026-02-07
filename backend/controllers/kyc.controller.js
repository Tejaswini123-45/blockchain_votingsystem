/**
 * KYC Controller
 * @description Handles ID card upload and KYC verification
 * @version 1.0.0
 */

const User = require('../models/User.model');
const { uploadIdCard, deleteFile, getIdCardPath, getIdCardUrl } = require('../config/upload');
const { sendKYCStatusEmail } = require('../config/email');
const { errorResponse, successResponse } = require('../utils/response');

// =============================================================================
// CONTROLLER METHODS
// =============================================================================

/**
 * Upload ID card for KYC verification
 * @route POST /api/kyc/upload
 * @access Private (students only)
 * 
 * @form-data {
 *   idCard: File (image)
 * }
 */
exports.uploadIdCardHandler = (req, res) => {
  uploadIdCard(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return errorResponse(res, 400, 'File size exceeds 5MB limit', 'FILE_TOO_LARGE');
        }
        return errorResponse(res, 400, err.message, 'UPLOAD_ERROR');
      }

      // Check if file was uploaded
      if (!req.file) {
        return errorResponse(res, 400, 'Please upload an ID card image', 'NO_FILE');
      }

      // Find user
      const user = await User.findById(req.user.id);
      if (!user) {
        // Delete uploaded file
        deleteFile(req.file.path);
        return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
      }

      // Check if KYC already approved
      if (user.kycStatus === 'approved') {
        deleteFile(req.file.path);
        return errorResponse(res, 400, 'KYC already approved', 'KYC_ALREADY_APPROVED');
      }

      // Delete old ID card if exists
      if (user.idCardImage) {
        const oldFilePath = getIdCardPath(user.idCardImage);
        deleteFile(oldFilePath);
      }

      // Update user with new ID card
      user.idCardImage = req.file.filename;
      user.kycSubmittedAt = new Date();
      user.kycRejectionReason = null;
      
      // Auto-approve if AUTO_APPROVE_KYC is set (for quick testing)
      // Set to 'false' to require admin approval
      if (process.env.AUTO_APPROVE_KYC === 'true') {
        user.kycStatus = 'approved';
        user.kycVerifiedAt = new Date();
        await user.save();
        
        return successResponse(res, 200, 'ID card uploaded and auto-approved!', {
          kycStatus: 'approved',
          idCardUrl: getIdCardUrl(req.file.filename),
        });
      }
      
      user.kycStatus = 'pending';
      await user.save();

      return successResponse(res, 200, 'ID card uploaded successfully. Awaiting verification.', {
        kycStatus: 'pending',
        idCardUrl: getIdCardUrl(req.file.filename),
      });
    } catch (error) {
      // Delete file if error occurred
      if (req.file) {
        deleteFile(req.file.path);
      }
      console.error('❌ Upload ID card error:', error);
      return errorResponse(res, 500, 'Failed to upload ID card', 'UPLOAD_FAILED');
    }
  });
};

/**
 * Get KYC status for current user
 * @route GET /api/kyc/status
 * @access Private
 */
exports.getKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('kycStatus idCardImage kycSubmittedAt kycVerifiedAt kycRejectionReason');

    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    return successResponse(res, 200, 'KYC status retrieved', {
      kycStatus: user.kycStatus,
      hasIdCard: !!user.idCardImage,
      submittedAt: user.kycSubmittedAt,
      verifiedAt: user.kycVerifiedAt,
      rejectionReason: user.kycRejectionReason,
    });
  } catch (error) {
    console.error('❌ Get KYC status error:', error);
    return errorResponse(res, 500, 'Failed to get KYC status', 'FETCH_FAILED');
  }
};

/**
 * Get all pending KYC submissions (Admin only)
 * @route GET /api/kyc/pending
 * @access Private (admin only)
 */
exports.getPendingKYC = async (req, res) => {
  try {
    const pendingUsers = await User.getPendingKYC();

    // Add full image URLs
    const usersWithUrls = pendingUsers.map(user => ({
      ...user.toObject(),
      idCardUrl: user.idCardImage ? getIdCardUrl(user.idCardImage) : null,
    }));

    return successResponse(res, 200, `${pendingUsers.length} pending KYC submissions`, {
      count: pendingUsers.length,
      users: usersWithUrls,
    });
  } catch (error) {
    console.error('❌ Get pending KYC error:', error);
    return errorResponse(res, 500, 'Failed to fetch pending KYC', 'FETCH_FAILED');
  }
};

/**
 * Approve KYC (Admin only)
 * @route POST /api/kyc/approve/:userId
 * @access Private (admin only)
 * 
 * @params {
 *   userId: "STU001"
 * }
 */
exports.approveKYC = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByUserId(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    if (user.kycStatus !== 'pending') {
      return errorResponse(res, 400, `Cannot approve KYC with status: ${user.kycStatus}`, 'INVALID_STATUS');
    }

    // Update KYC status
    user.kycStatus = 'approved';
    user.kycVerifiedAt = new Date();
    user.kycRejectionReason = null;
    await user.save();

    // Send notification email
    try {
      await sendKYCStatusEmail(user.email, user.name, 'approved');
    } catch (emailError) {
      console.error('Failed to send KYC approval email:', emailError);
      // Don't fail the request if email fails
    }

    return successResponse(res, 200, 'KYC approved successfully', {
      userId: user.userId,
      kycStatus: 'approved',
    });
  } catch (error) {
    console.error('❌ Approve KYC error:', error);
    return errorResponse(res, 500, 'Failed to approve KYC', 'APPROVE_FAILED');
  }
};

/**
 * Reject KYC (Admin only)
 * @route POST /api/kyc/reject/:userId
 * @access Private (admin only)
 * 
 * @params {
 *   userId: "STU001"
 * }
 * @body {
 *   "reason": "ID card image is blurry"
 * }
 */
exports.rejectKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByUserId(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    if (user.kycStatus !== 'pending') {
      return errorResponse(res, 400, `Cannot reject KYC with status: ${user.kycStatus}`, 'INVALID_STATUS');
    }

    // Update KYC status
    user.kycStatus = 'rejected';
    user.kycVerifiedAt = new Date();
    user.kycRejectionReason = reason || 'Document unclear or invalid';
    await user.save();

    // Delete the ID card image
    if (user.idCardImage) {
      const filePath = getIdCardPath(user.idCardImage);
      deleteFile(filePath);
    }

    // Send notification email
    try {
      await sendKYCStatusEmail(user.email, user.name, 'rejected', user.kycRejectionReason);
    } catch (emailError) {
      console.error('Failed to send KYC rejection email:', emailError);
    }

    return successResponse(res, 200, 'KYC rejected', {
      userId: user.userId,
      kycStatus: 'rejected',
      reason: user.kycRejectionReason,
    });
  } catch (error) {
    console.error('❌ Reject KYC error:', error);
    return errorResponse(res, 500, 'Failed to reject KYC', 'REJECT_FAILED');
  }
};

/**
 * Get ID card image (Admin only)
 * @route GET /api/kyc/image/:userId
 * @access Private (admin only)
 */
exports.getIdCardImage = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByUserId(userId).select('idCardImage');
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    if (!user.idCardImage) {
      return errorResponse(res, 404, 'No ID card uploaded', 'NO_ID_CARD');
    }

    const filePath = getIdCardPath(user.idCardImage);
    
    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('❌ Error sending file:', err);
        return errorResponse(res, 404, 'ID card image not found', 'FILE_NOT_FOUND');
      }
    });
  } catch (error) {
    console.error('❌ Get ID card image error:', error);
    return errorResponse(res, 500, 'Failed to get ID card image', 'FETCH_FAILED');
  }
};
