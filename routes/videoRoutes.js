import express from 'express';
import { getVideoSession } from '../controllers/videoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });
router.get('/', authMiddleware, getVideoSession);

export default router;