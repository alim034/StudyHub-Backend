import VideoSession from '../models/VideoSession.js';

export const getVideoSession = async (req, res) => {
  try {
    const session = await VideoSession.findOne({ room: req.params.roomId });
    res.json(session || {});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};