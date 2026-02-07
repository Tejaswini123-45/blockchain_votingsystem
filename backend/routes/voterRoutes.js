/**
 * Voter Routes
 * @description Routes for blockchain-based anonymous voting with commit-reveal scheme
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const User = require('../models/User.model');
const { verifyToken } = require('../middlewares/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');

// =============================================================================
// REGISTER VOTER (Link wallet to student)
// =============================================================================

/**
 * @route   POST /api/voters/register
 * @desc    Register a voter with student ID and wallet address
 * @access  Public (for initial registration) or Private
 */
router.post('/register', async (req, res) => {
  try {
    const { studentId, walletAddress } = req.body;

    // Validate input
    if (!studentId) {
      return sendError(res, 'Student ID is required', 400);
    }

    // Check if student exists in User model
    const user = await User.findByUserId(studentId);
    if (!user) {
      return sendError(res, 'Student not found. Please register first.', 404);
    }

    // Check if voter already exists
    let voter = await Voter.findByStudentId(studentId);
    
    if (voter) {
      // If wallet provided, connect it
      if (walletAddress) {
        // Check if wallet is already used by another voter
        const existingWallet = await Voter.findByWallet(walletAddress);
        if (existingWallet && existingWallet.studentId !== studentId.toUpperCase()) {
          return sendError(res, 'Wallet address already registered to another student', 400);
        }
        
        await voter.connectWallet(walletAddress);
      }
      
      return sendSuccess(res, {
        voter: voter.toJSON(),
        message: 'Voter profile updated',
      });
    }

    // Create new voter - don't set walletAddress if not provided (sparse index)
    const voterData = {
      studentId: studentId.toUpperCase(),
      userId: user._id,
      isOtpVerified: user.isVerified,
      otpVerifiedAt: user.isVerified ? new Date() : null,
    };
    
    // Only set walletAddress if explicitly provided (sparse index needs undefined, not null)
    if (walletAddress) {
      voterData.walletAddress = walletAddress.toLowerCase();
      voterData.walletConnectedAt = new Date();
    }

    voter = new Voter(voterData);
    voter.updateEligibility();
    await voter.save();

    return sendSuccess(res, {
      voter: voter.toJSON(),
      message: 'Voter registered successfully',
    }, 201);
  } catch (error) {
    console.error('Voter registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendError(res, `${field} already registered`, 400);
    }
    
    return sendError(res, error.message || 'Registration failed', 500);
  }
});

// =============================================================================
// CONNECT WALLET
// =============================================================================

/**
 * @route   POST /api/voters/connect-wallet
 * @desc    Connect MetaMask wallet to voter profile
 * @access  Private
 */
router.post('/connect-wallet', verifyToken, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return sendError(res, 'Wallet address is required', 400);
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    // Get or create voter for this user
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    let voter = await Voter.getOrCreateForUser(user);

    // Check if wallet is already used by another voter
    const existingWallet = await Voter.findByWallet(walletAddress);
    if (existingWallet && !existingWallet.userId.equals(user._id)) {
      return sendError(res, 'Wallet address already registered to another student', 400);
    }

    // Connect wallet
    await voter.connectWallet(walletAddress);

    return sendSuccess(res, {
      voter: voter.toJSON(),
      message: 'Wallet connected successfully',
    });
  } catch (error) {
    console.error('Connect wallet error:', error);
    return sendError(res, error.message || 'Failed to connect wallet', 500);
  }
});

// =============================================================================
// COMMIT VOTE (After MetaMask transaction)
// =============================================================================

/**
 * @route   POST /api/voters/commit
 * @desc    Store commitment hash after MetaMask transaction succeeds
 * @access  Private
 * 
 * This is called AFTER the blockchain transaction is confirmed.
 * The commitmentHash links the off-chain record to on-chain vote.
 */
router.post('/commit', verifyToken, async (req, res) => {
  try {
    const { positionId, commitmentHash, secretSalt, transactionHash, blockNumber } = req.body;

    // Validate required fields
    if (!commitmentHash) {
      return sendError(res, 'Commitment hash is required', 400);
    }
    if (!positionId) {
      return sendError(res, 'Position ID is required', 400);
    }

    // Get user and voter
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check KYC status
    if (user.kycStatus !== 'approved') {
      return sendError(res, 'KYC must be approved before voting', 403);
    }

    // Get or create voter
    let voter = await Voter.getOrCreateForUser(user);

    // Check if already voted for this position
    if (voter.hasVotedForPosition(positionId)) {
      return sendError(res, `Already voted for position ${positionId}`, 400);
    }

    // Check eligibility
    if (!voter.isEligible && !voter.walletAddress) {
      return sendError(res, 'Please connect your wallet first', 400);
    }

    // Add the vote commitment
    await voter.addVoteCommitment(positionId, commitmentHash, transactionHash);

    // Update additional fields if provided
    if (secretSalt) {
      // Store encrypted - in production, use proper encryption
      voter.secretSalt = secretSalt;
    }
    if (blockNumber) {
      voter.blockNumber = blockNumber;
    }
    if (transactionHash) {
      voter.transactionHash = transactionHash;
    }

    await voter.save();

    return sendSuccess(res, {
      voter: {
        studentId: voter.studentId,
        hasCommitted: voter.hasCommitted,
        committedAt: voter.committedAt,
        positionsVoted: voter.votedPositions.length,
        transactionHash: voter.transactionHash,
        blockNumber: voter.blockNumber,
      },
      message: 'Vote commitment stored successfully',
    }, 201);
  } catch (error) {
    console.error('Commit vote error:', error);
    return sendError(res, error.message || 'Failed to commit vote', 500);
  }
});

// =============================================================================
// REVEAL VOTE
// =============================================================================

/**
 * @route   PATCH /api/voters/reveal
 * @desc    Mark vote as revealed (after reveal phase on blockchain)
 * @access  Private
 */
router.patch('/reveal', verifyToken, async (req, res) => {
  try {
    const { positionId } = req.body;

    if (!positionId) {
      return sendError(res, 'Position ID is required', 400);
    }

    // Get user and voter
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const voter = await Voter.findOne({ userId: user._id });
    if (!voter) {
      return sendError(res, 'Voter profile not found', 404);
    }

    // Check if voted for this position
    if (!voter.hasVotedForPosition(positionId)) {
      return sendError(res, `No vote commitment found for position ${positionId}`, 400);
    }

    // Check if already revealed
    const votePosition = voter.votedPositions.find(vp => vp.positionId === positionId);
    if (votePosition.hasRevealed) {
      return sendError(res, 'Vote already revealed for this position', 400);
    }

    // Mark as revealed
    await voter.revealVote(positionId);

    return sendSuccess(res, {
      voter: {
        studentId: voter.studentId,
        hasRevealed: voter.hasRevealed,
        revealedAt: voter.revealedAt,
        positionRevealed: positionId,
      },
      message: 'Vote revealed successfully',
    });
  } catch (error) {
    console.error('Reveal vote error:', error);
    return sendError(res, error.message || 'Failed to reveal vote', 500);
  }
});

// =============================================================================
// GET VOTER STATUS
// =============================================================================

/**
 * @route   GET /api/voters/status
 * @desc    Get current voter's status
 * @access  Private
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const voter = await Voter.findOne({ userId: user._id });
    
    if (!voter) {
      return sendSuccess(res, {
        registered: false,
        message: 'Voter profile not created yet',
      });
    }

    return sendSuccess(res, {
      registered: true,
      studentId: voter.studentId,
      walletConnected: !!voter.walletAddress,
      walletAddress: voter.walletAddress,
      isEligible: voter.isEligible,
      eligibilityReason: voter.eligibilityReason,
      hasCommitted: voter.hasCommitted,
      committedAt: voter.committedAt,
      hasRevealed: voter.hasRevealed,
      revealedAt: voter.revealedAt,
      positionsVoted: voter.votedPositions.map(vp => ({
        positionId: vp.positionId,
        hasRevealed: vp.hasRevealed,
        committedAt: vp.committedAt,
        revealedAt: vp.revealedAt,
      })),
      createdAt: voter.createdAt,
      updatedAt: voter.updatedAt,
    });
  } catch (error) {
    console.error('Get voter status error:', error);
    return sendError(res, 'Failed to get voter status', 500);
  }
});

// =============================================================================
// GET VOTING STATS (Admin)
// =============================================================================

/**
 * @route   GET /api/voters/stats
 * @desc    Get voting statistics
 * @access  Public (for transparency)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Voter.getVotingStats();
    
    return sendSuccess(res, {
      stats,
      message: 'Voting statistics retrieved',
    });
  } catch (error) {
    console.error('Get voting stats error:', error);
    return sendError(res, 'Failed to get voting statistics', 500);
  }
});

module.exports = router;
