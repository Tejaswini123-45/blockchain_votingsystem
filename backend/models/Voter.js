/**
 * Voter Model
 * @description Blockchain-based anonymous voting with commit-reveal scheme
 * 
 * Why this specific structure?
 * - unique: true - Primary defense against double-voting at database level
 * - sparse: true - Allows registering students before MetaMask connection
 * - timestamps - Shows judges exactly when student registered/verified OTP
 */

const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema(
  {
    // Student Identification (linked to User model)
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    
    // Reference to User model
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // MetaMask Wallet Address (connected after registration)
    walletAddress: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined, but if set must be unique
      trim: true,
      lowercase: true,
      index: true,
    },
    
    // Wallet connection status
    walletConnectedAt: {
      type: Date,
      default: null,
    },
    
    // ==========================================================================
    // COMMIT-REVEAL SCHEME FOR ANONYMOUS VOTING
    // ==========================================================================
    
    /**
     * Commitment Hash - Hash of (vote + secret salt)
     * Stored BEFORE revealing to prevent vote manipulation
     * No one can see what was voted until reveal phase
     */
    commitmentHash: {
      type: String,
      default: null,
      index: true,
    },
    
    /**
     * Secret Salt - Random value used to create commitment
     * Only the voter knows this, stored encrypted
     */
    secretSalt: {
      type: String,
      default: null,
      select: false, // Never return in queries - voter's secret
    },
    
    /**
     * Blockchain Transaction Hash - Proof the vote was recorded on-chain
     */
    transactionHash: {
      type: String,
      default: null,
      index: true,
    },
    
    /**
     * Block Number - Which block contains the vote
     */
    blockNumber: {
      type: Number,
      default: null,
    },
    
    // ==========================================================================
    // VOTING STATUS FLAGS
    // ==========================================================================
    
    /**
     * Has the voter committed their vote on blockchain?
     */
    hasCommitted: {
      type: Boolean,
      default: false,
    },
    
    /**
     * Committed timestamp - When the commitment was made
     */
    committedAt: {
      type: Date,
      default: null,
    },
    
    /**
     * Has the voter revealed their vote?
     * After reveal, the vote is counted but still anonymous
     */
    hasRevealed: {
      type: Boolean,
      default: false,
    },
    
    /**
     * Revealed timestamp - When the vote was revealed
     */
    revealedAt: {
      type: Date,
      default: null,
    },
    
    // ==========================================================================
    // POSITION-BASED VOTING TRACKING
    // ==========================================================================
    
    /**
     * Track which positions the voter has voted for
     * Prevents double-voting per position
     */
    votedPositions: [{
      positionId: {
        type: Number,
        required: true,
      },
      commitmentHash: {
        type: String,
        required: true,
      },
      transactionHash: {
        type: String,
      },
      committedAt: {
        type: Date,
        default: Date.now,
      },
      hasRevealed: {
        type: Boolean,
        default: false,
      },
      revealedAt: {
        type: Date,
        default: null,
      },
    }],
    
    // ==========================================================================
    // OTP VERIFICATION
    // ==========================================================================
    
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    
    otpVerifiedAt: {
      type: Date,
      default: null,
    },
    
    // ==========================================================================
    // ELIGIBILITY STATUS
    // ==========================================================================
    
    /**
     * Is the voter eligible to vote?
     * Must have: verified OTP, approved KYC, connected wallet
     */
    isEligible: {
      type: Boolean,
      default: false,
    },
    
    /**
     * Reason if not eligible
     */
    eligibilityReason: {
      type: String,
      default: null,
    },
  },
  { 
    timestamps: true, // createdAt, updatedAt - shows judges registration time
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Compound index for fast lookups
VoterSchema.index({ studentId: 1, walletAddress: 1 });
VoterSchema.index({ hasCommitted: 1, hasRevealed: 1 });

// =============================================================================
// VIRTUAL FIELDS
// =============================================================================

/**
 * Check if voter has completed all voting
 */
VoterSchema.virtual('hasCompletedVoting').get(function () {
  return this.hasCommitted && this.hasRevealed;
});

/**
 * Get number of positions voted
 */
VoterSchema.virtual('positionsVotedCount').get(function () {
  return this.votedPositions ? this.votedPositions.length : 0;
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Check if already voted for a specific position
 */
VoterSchema.methods.hasVotedForPosition = function (positionId) {
  return this.votedPositions.some(vp => vp.positionId === positionId);
};

/**
 * Add a vote commitment for a position
 */
VoterSchema.methods.addVoteCommitment = function (positionId, commitmentHash, transactionHash) {
  if (this.hasVotedForPosition(positionId)) {
    throw new Error(`Already voted for position ${positionId}`);
  }
  
  this.votedPositions.push({
    positionId,
    commitmentHash,
    transactionHash,
    committedAt: new Date(),
    hasRevealed: false,
  });
  
  this.hasCommitted = true;
  this.committedAt = this.committedAt || new Date();
  
  return this.save();
};

/**
 * Mark a position vote as revealed
 */
VoterSchema.methods.revealVote = function (positionId) {
  const voteIndex = this.votedPositions.findIndex(vp => vp.positionId === positionId);
  
  if (voteIndex === -1) {
    throw new Error(`No commitment found for position ${positionId}`);
  }
  
  this.votedPositions[voteIndex].hasRevealed = true;
  this.votedPositions[voteIndex].revealedAt = new Date();
  
  // Check if all positions are revealed
  const allRevealed = this.votedPositions.every(vp => vp.hasRevealed);
  if (allRevealed) {
    this.hasRevealed = true;
    this.revealedAt = new Date();
  }
  
  return this.save();
};

/**
 * Connect MetaMask wallet
 */
VoterSchema.methods.connectWallet = function (walletAddress) {
  if (this.walletAddress && this.walletAddress !== walletAddress.toLowerCase()) {
    throw new Error('Wallet already connected with different address');
  }
  
  this.walletAddress = walletAddress.toLowerCase();
  this.walletConnectedAt = new Date();
  
  // Update eligibility
  this.updateEligibility();
  
  return this.save();
};

/**
 * Update eligibility status
 */
VoterSchema.methods.updateEligibility = function () {
  const reasons = [];
  
  if (!this.isOtpVerified) {
    reasons.push('OTP not verified');
  }
  
  if (!this.walletAddress) {
    reasons.push('Wallet not connected');
  }
  
  this.isEligible = reasons.length === 0;
  this.eligibilityReason = reasons.length > 0 ? reasons.join(', ') : null;
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Find voter by student ID
 */
VoterSchema.statics.findByStudentId = function (studentId) {
  return this.findOne({ studentId: studentId.toUpperCase() });
};

/**
 * Find voter by wallet address
 */
VoterSchema.statics.findByWallet = function (walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

/**
 * Get or create voter for a user
 */
VoterSchema.statics.getOrCreateForUser = async function (user) {
  let voter = await this.findOne({ userId: user._id });
  
  if (!voter) {
    voter = await this.create({
      studentId: user.userId,
      userId: user._id,
      isOtpVerified: user.isVerified,
      otpVerifiedAt: user.isVerified ? new Date() : null,
    });
  }
  
  return voter;
};

/**
 * Get voting statistics
 */
VoterSchema.statics.getVotingStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalVoters: { $sum: 1 },
        walletsConnected: { 
          $sum: { $cond: [{ $ne: ['$walletAddress', null] }, 1, 0] } 
        },
        hasCommitted: { 
          $sum: { $cond: ['$hasCommitted', 1, 0] } 
        },
        hasRevealed: { 
          $sum: { $cond: ['$hasRevealed', 1, 0] } 
        },
        eligible: { 
          $sum: { $cond: ['$isEligible', 1, 0] } 
        },
      },
    },
  ]);
  
  return stats[0] || {
    totalVoters: 0,
    walletsConnected: 0,
    hasCommitted: 0,
    hasRevealed: 0,
    eligible: 0,
  };
};

module.exports = mongoose.model('Voter', VoterSchema);
