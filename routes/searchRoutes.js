import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/search
router.get('/search', authMiddleware, globalSearch);

export default router;
