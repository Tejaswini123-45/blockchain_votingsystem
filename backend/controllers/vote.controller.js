/**
 * Vote Controller
 * @description Handles voting operations with security checks
 * @version 1.0.0
 */

const Vote = require('../models/Vote');
const User = require('../models/User.model');
const Candidate = require('../models/Candidate');
const { errorResponse, successResponse } = require('../utils/response');

/**
 * POST /api/votes
 * @description Cast a vote for a candidate
 * @access Private (Students only, KYC approved, not voted yet)
 * 
 * Security checks:
 * 1. User must be authenticated
 * 2. User must be a student
 * 3. User must have KYC approved
 * 4. User must not have already voted for this position
 */
exports.castVote = async (req, res) => {
  try {
    const { candidateId, position } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!candidateId || !position) {
      return errorResponse(res, 400, 'Candidate ID and position are required', 'MISSING_FIELDS');
    }

    // Get user with latest data
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    // Check if student role
    if (user.role !== 'student') {
      return errorResponse(res, 403, 'Only students can vote', 'NOT_STUDENT');
    }

    // Check KYC status
    if (user.kycStatus !== 'approved') {
      return errorResponse(res, 403, 'KYC verification required before voting. Please complete your KYC.', 'KYC_REQUIRED');
    }

    // Check if user already voted for this position
    const existingVote = await Vote.findOne({ voter: userId, position });
    if (existingVote) {
      return errorResponse(res, 400, `You have already voted for ${position}`, 'ALREADY_VOTED_POSITION');
    }

    // Verify candidate exists and matches position
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return errorResponse(res, 404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
    }
    if (candidate.position !== position) {
      return errorResponse(res, 400, 'Candidate position mismatch', 'POSITION_MISMATCH');
    }

    // Create vote record
    const vote = await Vote.create({
      voter: userId,
      candidate: candidateId,
      position,
      votedAt: new Date(),
    });

    // Increment candidate vote count
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } });

    // Check if user has voted for all positions
    const allPositions = await Candidate.distinct('position');
    const userVotes = await Vote.countDocuments({ voter: userId });
    
    if (userVotes >= allPositions.length) {
      // Mark user as fully voted
      await User.findByIdAndUpdate(userId, { hasVoted: true });
    }

    return successResponse(res, 201, 'Vote cast successfully', {
      vote: {
        position,
        candidateName: candidate.name,
        votedAt: vote.votedAt,
      },
      remainingPositions: allPositions.length - userVotes,
    });
  } catch (error) {
    console.error('Cast Vote Error:', error);
    
    // Handle duplicate vote (MongoDB unique index error)
    if (error.code === 11000) {
      return errorResponse(res, 400, 'You have already voted for this position', 'DUPLICATE_VOTE');
    }
    
    return errorResponse(res, 500, 'Failed to cast vote', 'SERVER_ERROR');
  }
};

/**
 * GET /api/votes/my-votes
 * @description Get current user's voting history
 * @access Private (Students only)
 */
exports.getMyVotes = async (req, res) => {
  try {
    const votes = await Vote.find({ voter: req.user.id })
      .populate('candidate', 'name position department image')
      .sort({ votedAt: -1 });

    // Get all positions to show remaining
    const allPositions = await Candidate.distinct('position');
    const votedPositions = votes.map(v => v.position);
    const remainingPositions = allPositions.filter(p => !votedPositions.includes(p));

    return successResponse(res, 200, 'Votes retrieved', {
      votes,
      votedPositions,
      remainingPositions,
      hasVotedAll: remainingPositions.length === 0,
    });
  } catch (error) {
    console.error('Get My Votes Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve votes', 'SERVER_ERROR');
  }
};

/**
 * GET /api/votes/results
 * @description Get voting results (aggregated vote counts)
 * @access Public (or Admin only depending on election status)
 */
exports.getResults = async (req, res) => {
  try {
    // Get all candidates with their vote counts
    const candidates = await Candidate.find()
      .select('name position department votes image')
      .sort({ position: 1, votes: -1 });

    // Group by position
    const results = {};
    candidates.forEach(candidate => {
      if (!results[candidate.position]) {
        results[candidate.position] = [];
      }
      results[candidate.position].push({
        _id: candidate._id,
        name: candidate.name,
        department: candidate.department,
        votes: candidate.votes,
        image: candidate.image,
      });
    });

    // Get total votes cast
    const totalVotes = await Vote.countDocuments();
    const totalVoters = await Vote.distinct('voter').then(voters => voters.length);

    return successResponse(res, 200, 'Results retrieved', {
      results,
      statistics: {
        totalVotes,
        totalVoters,
      },
    });
  } catch (error) {
    console.error('Get Results Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve results', 'SERVER_ERROR');
  }
};

/**
 * GET /api/votes/status
 * @description Get current user's voting status
 * @access Private
 */
exports.getVotingStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    const allPositions = await Candidate.distinct('position');
    const userVotes = await Vote.find({ voter: req.user.id }).select('position');
    const votedPositions = userVotes.map(v => v.position);
    const remainingPositions = allPositions.filter(p => !votedPositions.includes(p));

    return successResponse(res, 200, 'Voting status retrieved', {
      hasVoted: user.hasVoted,
      kycStatus: user.kycStatus || 'not_submitted',
      canVote: user.kycStatus === 'approved' && !user.hasVoted,
      votedPositions,
      remainingPositions,
      totalPositions: allPositions.length,
      votedCount: votedPositions.length,
    });
  } catch (error) {
    console.error('Get Voting Status Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve voting status', 'SERVER_ERROR');
  }
};

/**
 * GET /api/votes/admin/stats
 * @description Get detailed voting statistics (admin only)
 * @access Private (Admin only)
 */
exports.getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const votedStudents = await User.countDocuments({ role: 'student', hasVoted: true });
    const kycApproved = await User.countDocuments({ role: 'student', kycStatus: 'approved' });
    const kycPending = await User.countDocuments({ role: 'student', kycStatus: 'pending' });

    const totalVotes = await Vote.countDocuments();
    const positions = await Candidate.distinct('position');

    // Votes per position
    const votesByPosition = {};
    for (const position of positions) {
      votesByPosition[position] = await Vote.countDocuments({ position });
    }

    // Department-wise voting
    const departmentStats = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          voted: { $sum: { $cond: ['$hasVoted', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return successResponse(res, 200, 'Admin statistics retrieved', {
      overview: {
        totalStudents,
        votedStudents,
        notVoted: totalStudents - votedStudents,
        votingPercentage: totalStudents > 0 ? Math.round((votedStudents / totalStudents) * 100) : 0,
      },
      kyc: {
        approved: kycApproved,
        pending: kycPending,
        notSubmitted: totalStudents - kycApproved - kycPending,
      },
      voting: {
        totalVotes,
        positions: positions.length,
        votesByPosition,
      },
      departments: departmentStats,
    });
  } catch (error) {
    console.error('Get Admin Stats Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve statistics', 'SERVER_ERROR');
  }
};
