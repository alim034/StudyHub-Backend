import Message from '../models/Message.js';

export const getRoomMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 30 } = req.query;
    const query = { room: id };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('user', 'name');
    res.json({ success: true, data: messages.reverse() }); // oldest first
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};