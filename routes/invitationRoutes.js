import express from 'express';
import { createInvitation, getInvitationDetails, acceptInvitation, listInvitations, resendInvitation } from '../controllers/invitationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Create invitation (admin only)
router.post('/api/rooms/:roomId/invitations', authMiddleware, createInvitation);

// Get invitation details (public)
router.get('/api/invitations/:token', getInvitationDetails);

// Accept invitation (auth required)
router.post('/api/invitations/:token/accept', authMiddleware, acceptInvitation);
// List all invitations for a room (admin only)
router.get('/api/rooms/:roomId/invitations/list', authMiddleware, listInvitations);

// Resend invitation (admin only)
router.post('/api/invitations/:invitationId/resend', authMiddleware, resendInvitation);

export default router;