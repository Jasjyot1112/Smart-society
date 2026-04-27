const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a unique QR token
 */
const generateQRToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate QR Code as base64 data URL
 * @param {string} data - data to encode in QR
 * @returns {string} base64 data URL
 */
const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return qrDataURL;
  } catch (err) {
    console.error('QR generation error:', err.message);
    return null;
  }
};

/**
 * Generate QR code for a visitor entry
 * @param {string} visitorId - MongoDB visitor document ID
 * @returns {{ qrToken: string, qrCode: string }}
 */
const generateVisitorQR = async (visitorId) => {
  const qrToken = generateQRToken();
  const payload = JSON.stringify({
    visitorId,
    token: qrToken,
    generatedAt: new Date().toISOString(),
  });
  const qrCode = await generateQRCode(payload);
  return { qrToken, qrCode };
};

module.exports = { generateQRToken, generateQRCode, generateVisitorQR };
