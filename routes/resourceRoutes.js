import express from 'express';
import { uploadResources, getResources, uploadNewVersion, deleteResource } from '../controllers/resourceController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router({ mergeParams: true });

// Use centralized multer instance which respects UPLOAD_DIR / tmpdir.
router.post('/', authMiddleware, upload.array('files'), uploadResources);
router.get('/', authMiddleware, getResources);
router.post('/:resourceId/version', authMiddleware, upload.single('file'), uploadNewVersion);
router.delete('/:resourceId', authMiddleware, deleteResource);

export default router;