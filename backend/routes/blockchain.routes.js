const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const { allowAdmin } = require('../middlewares/role.middleware');
const blockchainController = require('../controllers/blockchain.controller');

/**
 * Blockchain Routes
 * 
 * Handles voting token operations for blockchain voting
 */

// Get user's voting token (generates if doesn't exist)
router.get('/token', verifyToken, blockchainController.getVotingToken);

// Admin: Issue voting token to a user
router.post('/token/issue', verifyToken, allowAdmin, blockchainController.issueVotingToken);

// Admin: Get token hash for blockchain registration
router.get('/token/hash/:userId', verifyToken, allowAdmin, blockchainController.getTokenHashForBlockchain);

// Verify a token (for testing)
router.post('/token/verify', blockchainController.verifyToken);

module.exports = router;
