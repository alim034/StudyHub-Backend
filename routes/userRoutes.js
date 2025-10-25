import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Upload profile picture
router.post(
  '/profile/upload',
  authMiddleware,
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.profilePic = `/uploads/${req.file.filename}`;
      await user.save();
      res.json({ message: 'Profile picture uploaded', profilePic: user.profilePic });
    } catch (error) {
      res.status(500).json({ message: 'Upload failed', error: error.message });
    }
  }
);

export default router;