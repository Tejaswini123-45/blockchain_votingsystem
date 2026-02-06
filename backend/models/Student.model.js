/**
 * Student Model
 * @description Mongoose schema for student authentication
 * @author Senior MERN Developer
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      enum: {
        values: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSM'],
        message: '{VALUE} is not a valid department',
      },
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1, 'Year must be between 1 and 4'],
      max: [4, 'Year must be between 1 and 4'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    hasVoted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for faster queries
StudentSchema.index({ email: 1, studentId: 1 });

/**
 * Pre-save middleware - Hash password before saving
 */
StudentSchema.pre('save', async function () {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method - Compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
StudentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method - Get public profile (without sensitive data)
 * @returns {Object} - Student public data
 */
StudentSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    studentId: this.studentId,
    name: this.name,
    email: this.email,
    department: this.department,
    year: this.year,
    role: this.role,
    hasVoted: this.hasVoted,
    createdAt: this.createdAt,
  };
};

/**
 * Static method - Find student by credentials (email or studentId)
 * @param {string} identifier - Email or Student ID
 * @returns {Promise<Student|null>}
 */
StudentSchema.statics.findByCredentials = async function (identifier) {
  return await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { studentId: identifier.toUpperCase() },
    ],
    isActive: true,
  }).select('+password');
};

module.exports = mongoose.model('Student', StudentSchema);
