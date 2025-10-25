import express from 'express';
import { getBoardState, saveBoardState } from '../controllers/whiteboardController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.get('/', authMiddleware, getBoardState);
router.put('/', authMiddleware, saveBoardState);

export default router;
