const axios = require('axios');

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
// Fast2SMS uses Meta Cloud API structure for WhatsApp. 
// You must have an approved template in Fast2SMS for this to work.

/**
 * Format phone numbers for Fast2SMS (10 digits)
 */
const formatPhoneNumber = (phone) => {
  return phone.replace(/\D/g, '').slice(-10);
};

/**
 * Send SMS using Fast2SMS API (Generic)
 */
const sendFast2SMS = async (phone, message) => {
  if (!FAST2SMS_API_KEY) {
    console.log('⚠️  Fast2SMS not configured. SMS fallback skipped.');
    return false;
  }
  
  try {
    const digits = formatPhoneNumber(phone);
    
    await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'q',
      message: message,
      language: 'english',
      flash: 0,
      numbers: digits,
    }, {
      headers: { authorization: FAST2SMS_API_KEY }
    });
    
    console.log(`📱 SMS sent to ${digits}`);
    return true;
  } catch (err) {
    console.error('❌ Fast2SMS error:', err.response?.data?.message || err.message);
    return false;
  }
};

/**
 * Send SMS using Fast2SMS API (Fallback)
 */
const sendSMSOTP = async (phone, visitorName, otp) => {
  const message = `Smart Society ERP: Visitor ${visitorName} is at the gate. Your entry OTP is ${otp}. Valid for 5 minutes.`;
  return await sendFast2SMS(phone, message);
};

/**
 * Send WhatsApp OTP via Fast2SMS API
 * Falls back to Fast2SMS SMS if WhatsApp fails
 */
const sendWhatsAppOTP = async (phone, visitorName, flatNumber, otp, visitorId) => {
  if (!FAST2SMS_API_KEY) {
    console.log('⚠️  Fast2SMS not configured. OTP will fallback to App.');
    return 'app';
  }

  try {
    // Note: Fast2SMS WhatsApp requires pre-approved templates. 
    // You need to replace 'visitor_entry_otp' with your approved template name in Fast2SMS.
    // Also adjust the parameters according to your template.
    const digits = '91' + formatPhoneNumber(phone); // Needs country code for WhatsApp

    await axios.post('https://www.fast2sms.com/dev/whatsapp/v24.0/messages', {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: digits,
      type: "template",
      template: {
        name: "visitor_entry_otp", // ⚠️ Replace with your Fast2SMS approved template name
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: visitorName },
              { type: "text", text: flatNumber },
              { type: "text", text: otp }
            ]
          }
        ]
      }
    }, {
      headers: { 
        'Authorization': `Bearer ${FAST2SMS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`🟢 Fast2SMS WhatsApp OTP sent to ${digits}`);
    return 'whatsapp';
  } catch (err) {
    console.error('❌ Fast2SMS WhatsApp error:', err.response?.data?.message || err.message);
    // Fallback to SMS on WhatsApp failure (e.g. template error or number not on WhatsApp)
    const smsSent = await sendSMSOTP(phone, visitorName, otp);
    return smsSent ? 'sms' : 'app';
  }
};

module.exports = { sendWhatsAppOTP, sendSMSOTP, sendFast2SMS };
