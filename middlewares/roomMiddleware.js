import Room from '../models/Room.js';

// Checks if the user is a member of the room
export const isRoomMember = async (req, res, next) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id;
    const room = await Room.findById(roomId).select('members');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    // Check if user is in members array
    if (!room.members.some(member => member.equals(userId))) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
