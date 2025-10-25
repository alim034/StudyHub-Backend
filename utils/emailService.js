// backend/utils/emailService.js
// Reusable Nodemailer email service supporting Gmail SMTP or SendGrid SMTP

import nodemailer from 'nodemailer';

// Build transporter from environment variables
// Supports generic SMTP providers (Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.sendgrid.net or smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587/25
  auth: {
    user: process.env.SMTP_USER, // For SendGrid SMTP, typically 'apikey'
    pass: process.env.SMTP_PASS, // For SendGrid SMTP, the actual API key
  },
  logger: process.env.NODE_ENV !== 'production',
  debug: process.env.NODE_ENV !== 'production',
});

// Verifies SMTP connection on startup (optional but helpful)
async function verifyConnection() {
  try {
    await transporter.verify();
    if (process.env.NODE_ENV !== 'test') {
      console.log('[emailService] SMTP connection verified');
    }
  } catch (err) {
    console.error('[emailService] SMTP verification failed:', err?.message || err);
  }
}
verifyConnection();

// Reusable email sender
// Usage: await sendEmail({ to, subject, html, text })
export async function sendEmail({ to, subject, html, text }) {
  try {
    if (!to || !subject || !html) {
      throw new Error('Missing required email fields: to, subject, or html');
    }

    const from = process.env.EMAIL_FROM || 'no-reply@studyhub.local';

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || undefined,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[emailService] Email result -> messageId: ${info.messageId}, accepted: ${accepted.join(',')}, rejected: ${rejected.join(',')}`);
    }

    if (accepted.length === 0) {
      const errMsg = `SMTP did not accept any recipients. Rejected: ${rejected.join(',') || 'none'}`;
      throw new Error(errMsg);
    }

    return { success: true, messageId: info.messageId, accepted, rejected };
  } catch (err) {
    console.error('[emailService] Failed to send email:', err?.response || err?.message || err);
    return { success: false, error: err?.message || 'Email send failed' };
  }
}

export default { sendEmail };
