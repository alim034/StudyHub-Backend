import Whiteboard from '../models/Whiteboard.js';
import Room from '../models/Room.js';

// Ensure the user is a member of the room
async function assertMember(roomId, userId) {
  const room = await Room.findOne({ _id: roomId, members: userId });
  if (!room) {
    const err = new Error('Unauthorized: not a room member');
    err.status = 403;
    throw err;
  }
}

export const getBoardState = async (req, res) => {
  try {
    await assertMember(req.params.roomId, req.user._id);
    const doc = await Whiteboard.findOne({ room: req.params.roomId });
    res.json(doc ? doc.data : null);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const saveBoardState = async (req, res) => {
  try {
    await assertMember(req.params.roomId, req.user._id);
    const { data } = req.body; // expect { elements, appState }
    const saved = await Whiteboard.findOneAndUpdate(
      { room: req.params.roomId },
      { data, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};
