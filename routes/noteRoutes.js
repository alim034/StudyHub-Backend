import express from 'express';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/notes', authMiddleware, createNote);
router.get('/notes', authMiddleware, getNotes);
router.get('/notes/:id', authMiddleware, getNoteById);
router.put('/notes/:id', authMiddleware, updateNote);
router.delete('/notes/:id', authMiddleware, deleteNote);

// Upload attachments for a note
router.post(
  '/notes/:id/attachments',
  authMiddleware,
  upload.array('attachments', 5),
  async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ message: 'Note not found' });
      if (note.user.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const files = req.files.map(f => `/uploads/${f.filename}`);
      note.attachments = note.attachments.concat(files);
      await note.save();
      res.json({ message: 'Files uploaded', attachments: note.attachments });
    } catch (error) {
      res.status(500).json({ message: 'Attachment upload failed', error: error.message });
    }
  }
);

export default router;

