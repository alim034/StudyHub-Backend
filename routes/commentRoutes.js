import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  createComment,
  getComments,
  deleteComment,
} from '../controllers/commentController.js';

const router = express.Router();

router.post('/comments', authMiddleware, createComment);
router.get('/comments/:noteId', authMiddleware, getComments);
router.delete('/comments/:id', authMiddleware, deleteComment);

export default router;
