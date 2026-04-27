const crypto = require('crypto');
const { sendVisitorOTP } = require('./emailService');

/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create OTP object with expiry (10 minutes)
 */
const createOTPObject = () => {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { code, expiresAt, isUsed: false };
};

/**
 * Verify OTP
 * @param {Object} otpObject - stored OTP {code, expiresAt, isUsed}
 * @param {string} submittedCode - code submitted by visitor
 */
const verifyOTP = (otpObject, submittedCode) => {
  if (!otpObject || !otpObject.code) {
    return { valid: false, message: 'No OTP found for this visitor' };
  }
  if (otpObject.isUsed) {
    return { valid: false, message: 'OTP already used' };
  }
  if (new Date() > new Date(otpObject.expiresAt)) {
    return { valid: false, message: 'OTP has expired' };
  }
  if (otpObject.code !== submittedCode.trim()) {
    return { valid: false, message: 'Invalid OTP' };
  }
  return { valid: true, message: 'OTP verified successfully' };
};

/**
 * Send OTP to resident email and return OTP object to save in DB
 */
const sendAndSaveOTP = async (residentEmail, visitorName) => {
  const otpObj = createOTPObject();
  await sendVisitorOTP(residentEmail, visitorName, otpObj.code);
  return otpObj;
};

module.exports = { generateOTP, createOTPObject, verifyOTP, sendAndSaveOTP };
