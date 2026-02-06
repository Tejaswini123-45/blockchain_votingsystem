const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide candidate name'],
        trim: true
    },
    position: {
        type: String,
        required: [true, 'Please provide position'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Please provide department'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: ''
    },
    votes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Candidate', candidateSchema);
