import express from 'express';
import {
  register,
  login,
  getMe, // The controller function is correct
  deleteAllUsers,
  forgotPassword,
  resetPassword,
  updateProfile,
  uploadAvatar
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// FIX: Changed '/me' to '/profile' to match the frontend API call
router.get('/profile', authMiddleware, getMe);

// Update profile (name, optionally email or profilePic URL)
router.put('/profile', authMiddleware, updateProfile);

// Upload avatar image
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

router.delete('/all-users', deleteAllUsers); // Dev only

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
