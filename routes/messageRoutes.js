import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getRoomMessages } from '../controllers/messageController.js';

const router = express.Router();
router.get('/rooms/:id/messages', authMiddleware, getRoomMessages);
export default router;