/**
 * Candidate Routes
 * @description Routes for candidate management
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Import controller
const candidateController = require('../controllers/candidate.controller');

// Import middlewares
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowAdmin } = require('../middlewares/role.middleware');

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   GET /api/candidates
 * @desc    Get all candidates
 * @access  Public
 */
router.get('/', candidateController.getAllCandidates);

/**
 * @route   GET /api/candidates/positions
 * @desc    Get all available positions
 * @access  Public
 */
router.get('/positions', candidateController.getPositions);

/**
 * @route   GET /api/candidates/:id
 * @desc    Get single candidate by ID
 * @access  Public
 */
router.get('/:id', candidateController.getCandidate);

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * @route   POST /api/candidates
 * @desc    Create a new candidate
 * @access  Private (Admin only)
 */
router.post('/', verifyToken, allowAdmin, candidateController.createCandidate);

/**
 * @route   PUT /api/candidates/:id
 * @desc    Update a candidate
 * @access  Private (Admin only)
 */
router.put('/:id', verifyToken, allowAdmin, candidateController.updateCandidate);

/**
 * @route   DELETE /api/candidates/:id
 * @desc    Delete a candidate
 * @access  Private (Admin only)
 */
router.delete('/:id', verifyToken, allowAdmin, candidateController.deleteCandidate);

module.exports = router;
