// Example: how to use the email service from authController
import { sendEmail } from '../utils/emailService.js';
import { welcomeTemplate } from '../templates/welcomeTemplate.js';

// After user registration or password reset, for example
export const sendWelcomeEmail = async (req, res) => {
  try {
    const { email, name } = req.body;
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome to StudyHub${name ? `, ${name}` : ''}!</h2>
        <p>Your account has been created successfully.</p>
      </div>
    `;
    const result = await sendEmail({ to: email, subject: 'Welcome to StudyHub', html });
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send email' });
    }
    res.json({ message: 'Welcome email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { passwordResetTemplate } from '../templates/passwordResetTemplate.js';

// Helper to generate JWT consistently
const generateToken = (user, expiresIn = '30d') => {
  return jwt.sign(
    { id: user._id, username: user.name, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }
    // Normalize email (trim + lowercase) to keep consistent across register/login
    const normalizedEmail = String(email).trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    let user;
    try {
      user = await User.create({ name: String(name).trim(), email: normalizedEmail, password });
    } catch (err) {
      // Handle race condition on unique index
      if (err && (err.code === 11000 || err.code === 'E11000')) {
        return res.status(400).json({ message: 'User already exists' });
      }
      throw err;
    }
    const token = generateToken(user);
    // Send welcome email (multi-language ready)
    const { subject, html } = welcomeTemplate({ name: user.name });
    sendEmail({ to: user.email, subject, html }); // fire-and-forget, don't block registration

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email to avoid case-sensitivity issues (emails are stored lowercase)
    const normalizedEmail = String(email).trim().toLowerCase();

    // Primary lookup by normalized email
    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Fallback: case-insensitive exact match for legacy data where email wasn't normalized
    if (!user) {
      const ciMatch = await User.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }).select('+password');
      if (ciMatch) {
        user = ciMatch;
        // One-time repair: persist normalized lowercase email
        try {
          if (user.email !== normalizedEmail) {
            user.email = normalizedEmail;
            await user.save();
          }
        } catch (e) {
          // Non-fatal; proceed with login even if normalization save fails
          console.warn('[auth] Email normalization save failed for user', user._id, e?.message);
        }
      }
    }

    if (!user) {
      console.warn(`[auth] Login failed: user not found for ${normalizedEmail}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[auth] Login failed: password mismatch for ${normalizedEmail}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged-in user
// @route   GET /api/auth/profile
export const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc    Delete all users (DEV ONLY)
// @route   DELETE /api/auth/all-users
export const deleteAllUsers = async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({
      message: 'Success! All users have been deleted.',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot Password (generate reset token)
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No user with that email' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    // Build reset link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;
    const html = passwordResetTemplate({ name: user.name, resetLink });
    const mail = await sendEmail({ to: user.email, subject: 'Reset your StudyHub password', html });
    if (!mail.success) {
      return res.status(502).json({ error: `Email not sent: ${mail.error}` });
    }
    res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reset email', error: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    const jwtToken = generateToken(user, '2h'); // shorter expiry for reset
    res.json({
      message: 'Password reset successful',
      token: jwtToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// @desc    Update profile (name, optionally email)
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    const { name, email, profilePic } = req.body || {};

    const update = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof email === 'string' && email.trim()) update.email = email.trim().toLowerCase();
    if (typeof profilePic === 'string') update.profilePic = profilePic.trim();

    const updated = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        profilePic: updated.profilePic || '',
      },
      message: 'Profile updated',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// @desc    Upload avatar and set profilePic
// @route   POST /api/auth/upload-avatar
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const relativePath = `/uploads/${req.file.filename}`;
    const updated = await User.findByIdAndUpdate(
      userId,
      { profilePic: relativePath },
      { new: true }
    ).select('-password');

    res.json({
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        profilePic: updated.profilePic || relativePath,
      },
      path: relativePath,
      message: 'Avatar uploaded',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading avatar', error: error.message });
  }
};