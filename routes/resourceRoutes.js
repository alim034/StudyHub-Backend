import express from 'express';
import multer from 'multer';
import { uploadResources, getResources, uploadNewVersion, deleteResource } from '../controllers/resourceController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });
const upload = multer({ dest: 'public/uploads/' });

router.post('/', authMiddleware, upload.array('files'), uploadResources);
router.get('/', authMiddleware, getResources);
router.post('/:resourceId/version', authMiddleware, upload.single('file'), uploadNewVersion);
router.delete('/:resourceId', authMiddleware, deleteResource);

export default router;