const nodemailer = require('nodemailer');
const axios = require('axios');
const { db, query, run } = require('./db');
require('dotenv').config();

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.initEmailTransporter();
  }

  // Initialize email transporter
  initEmailTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      this.emailTransporter.verify((error, success) => {
        if (error) {
          console.error('Email transporter error:', error);
        } else {
          console.log('Email transporter ready');
        }
      });
    }
  }

  // Send email notification
  async sendEmail({ to, subject, text, html, memberId }) {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email transporter not configured');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      // Log notification
      if (memberId) {
        try {
          run(`
            INSERT INTO notifications (member_id, type, subject, message, status, sent_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [memberId, 'email', subject, text, 'sent']);
        } catch (logError) {
          console.warn('Failed to log notification to database:', logError.message);
        }
      }

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send error:', error);

      // Log failed notification
      if (memberId) {
        try {
          run(`
            INSERT INTO notifications (member_id, type, subject, message, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [memberId, 'email', subject, text, 'failed', error.message]);
        } catch (logError) {
          console.warn('Failed to log failed notification to database:', logError.message);
        }
      }

      return { success: false, error: error.message };
    }
  }

  // Send WhatsApp notification via Gupshup API
  async sendWhatsApp({ phone, message, memberId }) {
    try {
      if (!process.env.GUPSHUP_API_KEY || !process.env.GUPSHUP_APP_NAME) {
        throw new Error('Gupshup API not configured');
      }

      // Format phone number (ensure it starts with country code)
      let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
      if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone; // Add India country code
      }

      const payload = {
        channel: 'whatsapp',
        source: process.env.GUPSHUP_APP_NAME,
        destination: formattedPhone,
        message: {
          type: 'text',
          text: message
        }
      };

      const response = await axios.post(
        `${process.env.GUPSHUP_BASE_URL}/message`,
        payload,
        {
          headers: {
            'apikey': process.env.GUPSHUP_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // Log notification
      if (memberId) {
        try {
          run(`
            INSERT INTO notifications (member_id, type, message, status, sent_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [memberId, 'whatsapp', message, 'sent']);
        } catch (logError) {
          console.warn('Failed to log WhatsApp notification to database:', logError.message);
        }
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('WhatsApp send error:', error);

      // Log failed notification
      if (memberId) {
        try {
          run(`
            INSERT INTO notifications (member_id, type, message, status, error_message)
            VALUES (?, ?, ?, ?, ?)
          `, [memberId, 'whatsapp', message, 'failed', error.response?.data?.message || error.message]);
        } catch (logError) {
          console.warn('Failed to log failed WhatsApp notification to database:', logError.message);
        }
      }

      return { success: false, error: error.message };
    }
  }

  // Send membership expiry reminder
  async sendExpiryReminder(member) {
    const daysLeft = Math.ceil((new Date(member.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    const emailSubject = `Library Membership Expiry Reminder - ${daysLeft} days left`;
    const emailText = `
Dear ${member.name},

This is a friendly reminder that your library membership will expire on ${member.end_date}.

Days remaining: ${daysLeft}
Plan: ${member.plan_name}

Please visit the library to renew your membership to continue enjoying our services.

Thank you!
Library Management Team
    `;

    const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Library Membership Expiry Reminder</h2>
  <p>Dear <strong>${member.name}</strong>,</p>
  
  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <p style="margin: 0;"><strong>Your membership will expire on ${member.end_date}</strong></p>
    <p style="margin: 5px 0 0 0; color: #856404;">Days remaining: <strong>${daysLeft}</strong></p>
  </div>
  
  <p><strong>Current Plan:</strong> ${member.plan_name}</p>
  
  <p>Please visit the library to renew your membership to continue enjoying our services.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #666; font-size: 12px;">Library Management Team</p>
</div>
    `;

    const whatsappMessage = `
🚨 Library Membership Reminder

Hi ${member.name}! Your library membership expires on ${member.end_date} (${daysLeft} days left).

Plan: ${member.plan_name}

Please visit us to renew and continue enjoying our services.

Thank you! 📚
    `.trim();

    const results = [];

    // Send email if available
    if (member.email) {
      const emailResult = await this.sendEmail({
        to: member.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        memberId: member.id
      });
      results.push({ type: 'email', ...emailResult });
    }

    // Send WhatsApp if phone available
    if (member.phone) {
      const whatsappResult = await this.sendWhatsApp({
        phone: member.phone,
        message: whatsappMessage,
        memberId: member.id
      });
      results.push({ type: 'whatsapp', ...whatsappResult });
    }

    return results;
  }

  // Send welcome message to new member
  async sendWelcomeMessage(member) {
    const emailSubject = `Welcome to our Library - ${member.name}!`;
    const emailText = `
Dear ${member.name},

Welcome to our library! We're excited to have you as a member.

Membership Details:
- Plan: ${member.plan_name}
- Valid until: ${member.end_date}
- Member ID: ${member.id}

Your membership gives you access to our study rooms and facilities during operating hours.

Thank you for joining us!
Library Management Team
    `;

    const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #28a745;">Welcome to Our Library!</h2>
  <p>Dear <strong>${member.name}</strong>,</p>
  
  <p>Welcome to our library! We're excited to have you as a member.</p>
  
  <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #155724;">Membership Details</h3>
    <p style="margin: 5px 0;"><strong>Plan:</strong> ${member.plan_name}</p>
    <p style="margin: 5px 0;"><strong>Valid until:</strong> ${member.end_date}</p>
    <p style="margin: 5px 0;"><strong>Member ID:</strong> ${member.id}</p>
  </div>
  
  <p>Your membership gives you access to our study rooms and facilities during operating hours.</p>
  
  <p>Thank you for joining us!</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #666; font-size: 12px;">Library Management Team</p>
</div>
    `;

    const whatsappMessage = `
🎉 Welcome to Our Library!

Hi ${member.name}! Welcome to our library family.

📋 Your Membership:
- Plan: ${member.plan_name}
- Valid until: ${member.end_date}
- Member ID: ${member.id}

Enjoy our study rooms and facilities! 📚✨
    `.trim();

    const results = [];

    // Send email if available
    if (member.email) {
      const emailResult = await this.sendEmail({
        to: member.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        memberId: member.id
      });
      results.push({ type: 'email', ...emailResult });
    }

    // Send WhatsApp if phone available
    if (member.phone) {
      const whatsappResult = await this.sendWhatsApp({
        phone: member.phone,
        message: whatsappMessage,
        memberId: member.id
      });
      results.push({ type: 'whatsapp', ...whatsappResult });
    }

    return results;
  }

  // Get members expiring soon
  getExpiringMembers(days = 10) {
    return query(`
      SELECT m.*, mp.name as plan_name
      FROM members m
      LEFT JOIN membership_plans mp ON m.plan_id = mp.id
      WHERE m.status = 'active' 
        AND DATE(m.end_date) <= DATE('now', '+' || ? || ' days')
        AND DATE(m.end_date) >= DATE('now')
    `, [days]);
  }

  // Send bulk expiry reminders
  async sendBulkExpiryReminders() {
    const expiringMembers = this.getExpiringMembers();
    const results = [];

    for (const member of expiringMembers) {
      try {
        const memberResults = await this.sendExpiryReminder(member);
        results.push({
          memberId: member.id,
          memberName: member.name,
          results: memberResults
        });
      } catch (error) {
        console.error(`Error sending reminder to member ${member.id}:`, error);
        results.push({
          memberId: member.id,
          memberName: member.name,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = NotificationService;
