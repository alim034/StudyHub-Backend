import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

console.log('=== CONTACT ROUTES LOADED ===');
console.log('Environment variables check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET (length: ' + process.env.SMTP_PASS.length + ')' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('CONTACT_EMAIL:', process.env.CONTACT_EMAIL);

// Configure transporter (FIXED: createTransport not createTransporter)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:', error.message);
  } else {
    console.log('✅ SMTP Connection Successful - Ready to send emails');
  }
});

// Test route
router.get('/test-contact', (req, res) => {
  console.log('Test contact route hit');
  res.json({ 
    message: 'Contact routes working!',
    timestamp: new Date().toISOString()
  });
});

// Main contact route
router.post('/contact', async (req, res) => {
  console.log('\n=== NEW CONTACT FORM SUBMISSION ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  try {
    const { name, email, priority, subject, message } = req.body;
    
    // Validation
    if (!name || !email || !subject || !message) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }

    console.log('✅ Validation passed');

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"${name}" <${email}>`,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `StudyHub Contact: ${subject} (Priority: ${priority || 'medium'})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Priority:</strong> ${priority || 'medium'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 4px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Sent from StudyHub Contact Form at ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${name}
        Email: ${email}
        Priority: ${priority || 'medium'}
        Subject: ${subject}
        
        Message:
        ${message}
        
        Sent at: ${new Date().toLocaleString()}
      `
    };

    console.log('📧 Attempting to send email...');
    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully! We\'ll get back to you soon.',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('\n❌ CONTACT FORM ERROR:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;