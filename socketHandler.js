import { socketAuthMiddleware } from './middlewares/socketAuthMiddleware.js';
import Message from './models/Message.js';
import Room from './models/Room.js';
import VideoSession from './models/VideoSession.js';

export default function initializeSocket(io) {
  const roomsNamespace = io.of('/rooms');

  // Apply the authentication middleware to the namespace
  roomsNamespace.use(socketAuthMiddleware);

  roomsNamespace.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (ID: ${socket.user._id})`);

    socket.on('join', async ({ roomId }) => {
      try {
        const room = await Room.findOne({ _id: roomId, members: socket.user._id });
        if (!room) {
          return socket.emit('error', { message: 'Unauthorized: You are not a member of this room.' });
        }
        socket.join(roomId);
        console.log(`👍 User ${socket.user.name} successfully joined room "${room.name}"`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    socket.on('message:send', async ({ roomId, text }) => {
      try {
        const message = await Message.create({ room: roomId, user: socket.user._id, text });
        const populatedMessage = {
          _id: message._id,
          text: message.text,
          attachments: message.attachments,
          createdAt: message.createdAt,
          user: { _id: socket.user._id, name: socket.user.name },
        };
        roomsNamespace.to(roomId).emit('message:new', populatedMessage);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // --- ✅ FIX: ADDED TYPING INDICATOR BROADCASTING ---
    socket.on('typing:start', ({ roomId }) => {
      socket.broadcast.to(roomId).emit('typing:start', {
        _id: socket.user._id,
        name: socket.user.name,
      });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.broadcast.to(roomId).emit('typing:stop', {
        _id: socket.user._id,
        name: socket.user.name,
      });
    });
    // --- END OF FIX ---

    // --- Video Sync Events ---
    socket.on('video:load', async ({ roomId, url }) => {
      socket.to(roomId).emit('video:load:new', { url });
      await VideoSession.findOneAndUpdate(
        { room: roomId },
        { url, lastPositionSec: 0, isPlaying: false, updatedBy: socket.user._id },
        { upsert: true }
      );
    });

    socket.on('video:play', async ({ roomId, position }) => {
      socket.to(roomId).emit('video:play:new', { position });
      await VideoSession.findOneAndUpdate(
        { room: roomId },
        { isPlaying: true, lastPositionSec: position, updatedBy: socket.user._id }
      );
    });

    socket.on('video:pause', async ({ roomId, position }) => {
      socket.to(roomId).emit('video:pause:new', { position });
      await VideoSession.findOneAndUpdate(
        { room: roomId },
        { isPlaying: false, lastPositionSec: position, updatedBy: socket.user._id }
      );
    });

    socket.on('video:seek', ({ roomId, position }) => {
      socket.to(roomId).emit('video:seek:new', { position });
    });

    socket.on('disconnect', () => {
      console.log(` User ${socket.user?.name} disconnected.`);
    });

    // --- Whiteboard Sync Events ---
    socket.on('whiteboard:draw', async ({ roomId, elements, appState }) => {
      try {
        // Ensure socket is in room (membership validated on join)
        const rooms = Array.from(socket.rooms || []);
        if (!rooms.includes(roomId)) return;
        // Broadcast to others in room
        socket.to(roomId).emit('whiteboard:update', { elements, appState });
      } catch (e) {
        socket.emit('error', { message: 'Failed to sync whiteboard' });
      }
    });
  });
}

