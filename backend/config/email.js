/**
 * Email Service Configuration
 * @description Nodemailer setup for OTP emails
 * @version 1.0.0
 */

const nodemailer = require('nodemailer');

// =============================================================================
// TRANSPORTER CONFIGURATION
// =============================================================================

/**
 * Create email transporter based on environment
 * Supports Gmail, Outlook, and custom SMTP
 */
const createTransporter = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

  const transporterConfigs = {
    gmail: {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password for Gmail
      },
    },
    outlook: {
      service: 'hotmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    },
  };

  return nodemailer.createTransport(transporterConfigs[emailProvider] || transporterConfigs.gmail);
};

// Create transporter instance
let transporter = null;

/**
 * Get or create transporter (lazy initialization)
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

/**
 * Generate OTP email HTML template
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP
 * @param {string} purpose - OTP purpose
 * @returns {string} - HTML email content
 */
const getOTPEmailTemplate = (name, otp, purpose = 'verification') => {
  const purposeMessages = {
    registration: 'complete your registration',
    login: 'verify your login',
    'password-reset': 'reset your password',
    'email-change': 'verify your new email address',
  };

  const purposeText = purposeMessages[purpose] || 'verify your identity';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
          🗳️ CLG Voting System
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
          Secure • Transparent • Democratic
        </p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">
          Hello, ${name}! 👋
        </h2>
        
        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          You requested to ${purposeText}. Please use the following OTP code:
        </p>

        <!-- OTP Box -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="color: rgba(255,255,255,0.8); margin: 0 0 10px 0; font-size: 14px;">
            Your Verification Code
          </p>
          <div style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          ⏰ This code will expire in <strong>10 minutes</strong>.
        </p>

        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
          If you didn't request this code, please ignore this email or contact support if you have concerns.
        </p>
      </td>
    </tr>

    <!-- Security Notice -->
    <tr>
      <td style="padding: 0 30px 30px;">
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
          <p style="color: #856404; font-size: 13px; margin: 0;">
            <strong>🔒 Security Tip:</strong> Never share your OTP with anyone. Our team will never ask for your OTP.
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #6c757d; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} CLG Voting System. All rights reserved.
        </p>
        <p style="color: #adb5bd; font-size: 11px; margin: 10px 0 0 0;">
          This is an automated message. Please do not reply.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Generate KYC status email template
 * @param {string} name - Recipient name
 * @param {string} status - KYC status (approved/rejected)
 * @param {string} reason - Rejection reason (if rejected)
 * @returns {string} - HTML email content
 */
const getKYCStatusEmailTemplate = (name, status, reason = null) => {
  const isApproved = status === 'approved';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🗳️ CLG Voting System</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333; margin: 0 0 20px 0;">Hello, ${name}!</h2>
        
        <div style="background-color: ${isApproved ? '#d4edda' : '#f8d7da'}; border-left: 4px solid ${isApproved ? '#28a745' : '#dc3545'}; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <h3 style="color: ${isApproved ? '#155724' : '#721c24'}; margin: 0 0 10px 0;">
            ${isApproved ? '✅ KYC Approved!' : '❌ KYC Rejected'}
          </h3>
          <p style="color: ${isApproved ? '#155724' : '#721c24'}; margin: 0;">
            ${isApproved 
              ? 'Your identity has been verified successfully. You can now participate in voting.' 
              : `Reason: ${reason || 'Document unclear or invalid'}`
            }
          </p>
        </div>

        ${!isApproved ? `
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Please upload a clearer photo of your ID card and try again.
        </p>
        ` : ''}
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #6c757d; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} CLG Voting System
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// =============================================================================
// EMAIL SENDING FUNCTIONS
// =============================================================================

/**
 * Send OTP email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP
 * @param {string} purpose - OTP purpose
 * @returns {Promise<Object>} - Send result
 */
exports.sendOTPEmail = async (to, name, otp, purpose = 'registration') => {
  try {
    const mailOptions = {
      from: `"CLG Voting System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Your OTP Code: ${otp} - CLG Voting System`,
      html: getOTPEmailTemplate(name, otp, purpose),
    };

    const info = await getTransporter().sendMail(mailOptions);
    
    console.log(`📧 OTP email sent to ${to}: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw new Error('Failed to send OTP email. Please try again.');
  }
};

/**
 * Send KYC status notification email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} status - KYC status
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} - Send result
 */
exports.sendKYCStatusEmail = async (to, name, status, reason = null) => {
  try {
    const mailOptions = {
      from: `"CLG Voting System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `KYC ${status === 'approved' ? 'Approved' : 'Update Required'} - CLG Voting System`,
      html: getKYCStatusEmailTemplate(name, status, reason),
    };

    const info = await getTransporter().sendMail(mailOptions);
    
    console.log(`📧 KYC status email sent to ${to}: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw new Error('Failed to send notification email.');
  }
};

/**
 * Verify email configuration is working
 * @returns {Promise<boolean>} - True if configuration is valid
 */
exports.verifyEmailConfig = async () => {
  try {
    await getTransporter().verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};
