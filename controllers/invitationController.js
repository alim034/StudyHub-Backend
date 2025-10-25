import Invitation from '../models/Invitation.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';
import { invitationTemplate } from '../templates/invitationTemplate.js';

// Helper: check if user is room admin
async function assertAdmin(roomId, userId) {
  const room = await Room.findById(roomId);
  if (!room || String(room.admin) !== String(userId)) {
    const err = new Error('Not authorized');
    err.status = 403;
    throw err;
  }
  return room;
}

// POST /api/rooms/:roomId/invitations
export const createInvitation = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const { roomId } = req.params;
    const inviterId = req.user._id;
    if (!email || !roomId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const room = await assertAdmin(roomId, inviterId);
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && room.members.map(String).includes(String(existingUser._id))) {
      return res.status(409).json({ error: 'User is already a member of this room.' });
    }
    const existingInvite = await Invitation.findOne({ room: roomId, email: email.toLowerCase(), status: 'pending' });
    if (existingInvite) {
      const inviteLink = `${process.env.CLIENT_URL}/invite/${existingInvite.token}`;
      const html = invitationTemplate({ roomName: room.name, inviteLink });
      const mail = await sendEmail({ to: email, subject: `Invitation to ${room.name} on StudyHub`, html });
      if (!mail.success) {
        return res.status(502).json({ error: `Email not sent: ${mail.error}` });
      }
      return res.status(200).json({ message: 'Invitation resent.', invitation: existingInvite });
    }
    const invitation = new Invitation({
      room: roomId,
      inviter: inviterId,
      email: email.toLowerCase(),
      role,
    });
    await invitation.save();
    const inviteLink = `${process.env.CLIENT_URL}/invite/${invitation.token}`;
    const html = invitationTemplate({ roomName: room.name, inviteLink });
    const mail = await sendEmail({ to: email, subject: `Invitation to ${room.name} on StudyHub`, html });
    if (!mail.success) {
      return res.status(502).json({ error: `Email not sent: ${mail.error}` });
    }
    res.status(201).json({ invitation });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  }
};

// GET /api/invitations/:token
export const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: 'Missing token.' });
    }
    const invitation = await Invitation.findOne({ token });
    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return res.status(404).json({ error: 'Invitation not found or expired.' });
    }
    const room = await Room.findById(invitation.room);
    const inviter = await User.findById(invitation.inviter);
    res.json({
      roomName: room?.name,
      inviterName: inviter?.name,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  }
};

// POST /api/invitations/:token/accept
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: 'Missing token.' });
    }
    const invitation = await Invitation.findOne({ token });
    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return res.status(404).json({ error: 'Invitation not found or expired.' });
    }
    if (req.user.email.toLowerCase() !== invitation.email) {
      return res.status(403).json({ error: 'This invitation is not for your email.' });
    }
    const room = await Room.findById(invitation.room);
    if (!room.members.map(String).includes(String(req.user._id))) {
      room.members.push(req.user._id);
      await room.save();
    }
    invitation.status = 'accepted';
    await invitation.save();
    res.json({ message: 'Invitation accepted.', roomId: room._id });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  }
};


// GET /api/rooms/:roomId/invitations/list
export const listInvitations = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ error: 'Missing roomId.' });
    }
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    if (String(room.admin) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const invitations = await Invitation.find({ room: roomId })
      .sort({ createdAt: -1 });
    res.json({ invitations });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  }
};

// POST /api/invitations/:invitationId/resend
export const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    if (!invitationId) {
      return res.status(400).json({ error: 'Missing invitationId.' });
    }
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }
    const room = await Room.findById(invitation.room);
    if (!room || String(room.admin) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    if (invitation.expiresAt < new Date() || invitation.status !== 'pending') {
      invitation.token = Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
      invitation.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
      invitation.status = 'pending';
      await invitation.save();
    }
    const inviteLink = `${process.env.CLIENT_URL}/invite/${invitation.token}`;
    const html = invitationTemplate({ roomName: room.name, inviteLink });
    const mail = await sendEmail({ to: invitation.email, subject: `Invitation to ${room.name} on StudyHub`, html });
    if (!mail.success) {
      return res.status(502).json({ error: `Email not sent: ${mail.error}` });
    }
    res.json({ message: 'Invitation resent.', invitation });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  }
};