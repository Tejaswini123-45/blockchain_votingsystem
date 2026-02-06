const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    position: {
        type: String,
        required: true
    },
    votedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only vote once per position
voteSchema.index({ voter: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
