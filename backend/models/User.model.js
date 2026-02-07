/**
 * User Model
 * @description Clean, unified schema for Student and Admin users
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
      uppercase: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
    },
    hasVoted: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // KYC Fields
    kycStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    idCardImage: {
      type: String,
      default: null,
    },
    kycSubmittedAt: {
      type: Date,
      default: null,
    },
    kycVerifiedAt: {
      type: Date,
      default: null,
    },
    kycRejectionReason: {
      type: String,
      default: null,
    },
    // Blockchain Voting Token Fields
    votingToken: {
      type: String,
      select: false, // Secret - don't return in queries by default
    },
    votingTokenHash: {
      type: String,
      index: true, // For lookup
    },
    votingTokenIssuedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude password)
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Static: Find by userId
UserSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId: userId.toUpperCase() });
};

// Static: Find by userId with password
UserSchema.statics.findByUserIdWithPassword = function (userId) {
  return this.findOne({ userId: userId.toUpperCase() }).select('+password');
};

module.exports = mongoose.model('User', UserSchema);
