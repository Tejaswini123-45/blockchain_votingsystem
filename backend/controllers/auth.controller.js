/**
 * Auth Controller
 * @description Handles authentication logic (register, login, profile)
 * @author Senior MERN Developer
 */

const jwt = require('jsonwebtoken');
const Student = require('../models/Student.model');

/**
 * Generate JWT Token
 * @param {string} studentId - MongoDB ObjectId of student
 * @param {string} role - User role
 * @returns {string} - JWT token
 */
const generateToken = (studentId, role) => {
  return jwt.sign(
    { id: studentId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Send token response with cookie
 * @param {Object} student - Student document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (student, statusCode, res) => {
  const token = generateToken(student._id, student.role);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    student: student.getPublicProfile(),
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { studentId, name, email, department, year, password } = req.body;

    // Validate required fields
    if (!studentId || !name || !email || !department || !year || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        required: ['studentId', 'name', 'email', 'department', 'year', 'password'],
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [
        { email: email.toLowerCase() },
        { studentId: studentId.toUpperCase() },
      ],
    });

    if (existingStudent) {
      const field = existingStudent.email === email.toLowerCase() ? 'email' : 'studentId';
      return res.status(409).json({
        success: false,
        message: `Student with this ${field} already exists`,
        field,
      });
    }

    // Create student
    const student = await Student.create({
      studentId: studentId.toUpperCase(),
      name,
      email: email.toLowerCase(),
      department,
      year: Number(year),
      password,
    });

    // Send token response
    sendTokenResponse(student, 201, res);
  } catch (error) {
    console.error('Register Error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        field,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login student with email/studentId and password
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, studentId, password } = req.body;

    // Check for identifier (email or studentId)
    const identifier = email || studentId;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or studentId',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password',
      });
    }

    // Find student by credentials
    const student = await Student.findByCredentials(identifier);

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await student.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save({ validateBeforeSave: false });

    // Send token response
    sendTokenResponse(student, 200, res);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in student
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      student: student.getPublicProfile(),
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout student (clear cookie)
 * @access  Private
 */
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @route   PUT /api/auth/password
 * @desc    Update password
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Get student with password
    const student = await Student.findById(req.student.id).select('+password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check current password
    const isMatch = await student.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    student.password = newPassword;
    await student.save();

    sendTokenResponse(student, 200, res);
  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
