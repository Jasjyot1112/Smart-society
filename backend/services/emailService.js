const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Smart Society ERP <noreply@smartsociety.com>',
      to,
      subject,
      html,
      text,
    });
    console.log('📧 Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    // Don't throw — email failure should not break the main flow
  }
};

// Email templates
const sendMaintenanceReminder = async (user, payment) => {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  await sendEmail({
    to: user.email,
    subject: `[Smart Society] Maintenance Due for ${monthNames[payment.month - 1]} ${payment.year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Smart Society ERP</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <h2>Maintenance Reminder</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your maintenance payment for <strong>${monthNames[payment.month - 1]} ${payment.year}</strong> is due.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount Due:</strong> ₹${payment.amount}</p>
            <p><strong>Flat:</strong> ${user.wing ? user.wing + '-' : ''}${user.flatNumber}</p>
          </div>
          <p>Please log in to the Smart Society portal to make the payment.</p>
          <a href="${process.env.FRONTEND_URL}/resident/payments" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Pay Now
          </a>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Smart Society Management System</p>
        </div>
      </div>
    `,
  });
};

const sendVisitorOTP = async (residentEmail, visitorName, otp) => {
  await sendEmail({
    to: residentEmail,
    subject: `[Smart Society] OTP for Visitor: ${visitorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Visitor Verification OTP</h1>
        </div>
        <div style="padding: 30px;">
          <p>Visitor <strong>${visitorName}</strong> is at the gate.</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; display: inline-block;">
              <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</p>
            </div>
          </div>
          <p style="color: #ef4444;">⚠️ This OTP expires in 10 minutes. Do not share it with anyone.</p>
          <p>Share this OTP with the visitor only if you wish to allow entry.</p>
        </div>
      </div>
    `,
  });
};

const sendComplaintUpdate = async (userEmail, userName, complaint) => {
  const statusColors = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    resolved: '#10b981',
    rejected: '#ef4444',
  };
  await sendEmail({
    to: userEmail,
    subject: `[Smart Society] Complaint Update: ${complaint.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2>Complaint Status Update</h2>
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Your complaint "<strong>${complaint.title}</strong>" has been updated.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> 
            <span style="color: ${statusColors[complaint.status] || '#6b7280'}; font-weight: bold; text-transform: uppercase;">
              ${complaint.status.replace('_', ' ')}
            </span>
          </p>
        </div>
        <a href="${process.env.FRONTEND_URL}/resident/complaints" 
           style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
          View Complaint
        </a>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendMaintenanceReminder, sendVisitorOTP, sendComplaintUpdate };
