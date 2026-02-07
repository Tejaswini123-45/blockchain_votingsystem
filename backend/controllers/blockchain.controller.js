/**
 * Blockchain Controller
 * 
 * Handles voting token generation and issuance for blockchain voting.
 * Tokens are issued after KYC approval and enable anonymous voting on the smart contract.
 */

const crypto = require('crypto');
const { ethers } = require('ethers');
const User = require('../models/User.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Generate a secure random voting token
 * This token will be used to cast votes anonymously on the blockchain
 */
const generateVotingToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate the hash of a token (for blockchain storage)
 */
const hashToken = (token) => {
    return ethers.keccak256(ethers.toUtf8Bytes(token));
};

/**
 * Get user's voting token
 * Returns the token if it exists, or generates a new one if KYC is approved
 */
exports.getVotingToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Check if KYC is approved
        if (user.kycStatus !== 'approved') {
            return sendError(res, 'KYC not approved. Complete KYC verification first.', 403);
        }

        // If user already has a token, return it
        if (user.votingToken) {
            return sendSuccess(res, {
                votingToken: user.votingToken,
                tokenHash: user.votingTokenHash,
                issuedAt: user.votingTokenIssuedAt,
                message: 'Voting token retrieved successfully'
            });
        }

        // Generate new token for first-time request
        const votingToken = generateVotingToken();
        const tokenHash = hashToken(votingToken);

        // Save to user record (token is kept secret, hash can be shared)
        user.votingToken = votingToken;
        user.votingTokenHash = tokenHash;
        user.votingTokenIssuedAt = new Date();
        await user.save();

        return sendSuccess(res, {
            votingToken,
            tokenHash,
            issuedAt: user.votingTokenIssuedAt,
            message: 'New voting token generated successfully',
            instructions: 'Keep this token secret! Use it to cast your vote on the blockchain.'
        }, 201);
    } catch (error) {
        console.error('Get voting token error:', error);
        return sendError(res, 'Failed to get voting token', 500);
    }
};

/**
 * Admin: Issue voting token to a specific user
 * Used after manual KYC approval
 */
exports.issueVotingToken = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return sendError(res, 'User ID is required', 400);
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Check if KYC is approved
        if (user.kycStatus !== 'approved') {
            return sendError(res, 'User KYC must be approved first', 400);
        }

        // Check if already has a token
        if (user.votingToken) {
            return sendError(res, 'User already has a voting token', 400);
        }

        // Generate token
        const votingToken = generateVotingToken();
        const tokenHash = hashToken(votingToken);

        // Save to user
        user.votingToken = votingToken;
        user.votingTokenHash = tokenHash;
        user.votingTokenIssuedAt = new Date();
        await user.save();

        return sendSuccess(res, {
            userId: user._id,
            userName: user.name,
            tokenHash, // Only return hash to admin, not the actual token
            issuedAt: user.votingTokenIssuedAt,
            message: 'Voting token issued successfully'
        }, 201);
    } catch (error) {
        console.error('Issue voting token error:', error);
        return sendError(res, 'Failed to issue voting token', 500);
    }
};

/**
 * Get token hash for admin to register on blockchain
 * Admin needs this to call issueVotingToken on the smart contract
 */
exports.getTokenHashForBlockchain = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        
        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        if (!user.votingTokenHash) {
            return sendError(res, 'User does not have a voting token', 400);
        }

        return sendSuccess(res, {
            userId: user._id,
            tokenHash: user.votingTokenHash,
            instructions: 'Use this hash to call issueVotingToken(hash) on the smart contract'
        });
    } catch (error) {
        console.error('Get token hash error:', error);
        return sendError(res, 'Failed to get token hash', 500);
    }
};

/**
 * Verify if a token is valid (for testing)
 */
exports.verifyToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return sendError(res, 'Token is required', 400);
        }

        const tokenHash = hashToken(token);
        
        // Check if any user has this token hash
        const user = await User.findOne({ votingTokenHash: tokenHash });

        if (!user) {
            return sendError(res, 'Invalid token', 400);
        }

        return sendSuccess(res, {
            valid: true,
            tokenHash,
            message: 'Token is valid'
        });
    } catch (error) {
        console.error('Verify token error:', error);
        return sendError(res, 'Failed to verify token', 500);
    }
};
