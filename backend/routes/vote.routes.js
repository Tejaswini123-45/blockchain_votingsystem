/**
 * Vote Routes
 * @description Routes for voting operations
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Import controller
const voteController = require('../controllers/vote.controller');

// Import middlewares
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowStudent, allowAdmin } = require('../middlewares/role.middleware');

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   GET /api/votes/results
 * @desc    Get voting results
 * @access  Public
 */
router.get('/results', voteController.getResults);

// =============================================================================
// STUDENT ROUTES
// =============================================================================

/**
 * @route   POST /api/votes
 * @desc    Cast a vote
 * @access  Private (Students only, KYC approved)
 */
router.post('/', verifyToken, allowStudent, voteController.castVote);

/**
 * @route   GET /api/votes/my-votes
 * @desc    Get current user's votes
 * @access  Private (Students only)
 */
router.get('/my-votes', verifyToken, allowStudent, voteController.getMyVotes);

/**
 * @route   GET /api/votes/status
 * @desc    Get current user's voting status
 * @access  Private
 */
router.get('/status', verifyToken, voteController.getVotingStatus);

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * @route   GET /api/votes/admin/stats
 * @desc    Get detailed voting statistics
 * @access  Private (Admin only)
 */
router.get('/admin/stats', verifyToken, allowAdmin, voteController.getAdminStats);

module.exports = router;
