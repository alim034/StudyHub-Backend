import express from 'express';
import * as  taskController  from '../controllers/taskController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { isRoomMember } from '../middlewares/roomMiddleware.js';
const router = express.Router({ mergeParams: true });

// POST /api/rooms/:roomId/tasks
router.post('/', authMiddleware, isRoomMember, taskController.createTask);
// GET /api/rooms/:roomId/tasks
router.get('/', authMiddleware, isRoomMember, taskController.getTasksInRoom);
// GET /api/rooms/:roomId/tasks/summary
router.get('/summary', authMiddleware, isRoomMember, taskController.getTaskSummary);
// PATCH /api/rooms/:roomId/tasks/:taskId
router.patch('/:taskId', authMiddleware, isRoomMember, taskController.updateTask);
// DELETE /api/rooms/:roomId/tasks/:taskId
router.delete('/:taskId', authMiddleware, isRoomMember, taskController.deleteTask);

export default router;
