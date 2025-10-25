import express from 'express';
import { createEvent, getEvents, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.post('/', createEvent); // Handles POST /api/rooms/:roomId/events
router.get('/', getEvents);
router.patch('/:eventId', updateEvent);
router.delete('/:eventId', deleteEvent);

export default router;