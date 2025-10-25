import Message from '../models/Message.js';
import Note from '../models/Note.js';
import Task from '../models/Task.js';
import Resource from '../models/Resource.js';
import Room from '../models/Room.js';

// GET /api/search?q=term&type=messages,notes&startDate=...&endDate=...&page=1&limit=20
export const globalSearch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { q = '', type, startDate, endDate, page = 1, limit = 20 } = req.query;
    const types = type ? type.split(',') : ['messages', 'notes', 'tasks', 'resources'];
    const regex = q ? { $regex: q, $options: 'i' } : undefined;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Find rooms user is a member of
    const userRooms = await Room.find({ members: userId }).select('_id');
    const roomIds = userRooms.map(r => r._id);

    let results = [];

    // Messages
    if (types.includes('messages')) {
      const filter = { room: { $in: roomIds } };
      if (regex) filter.content = regex;
      if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;
      const messages = await Message.find(filter).limit(limit).skip((page-1)*limit);
      results.push(...messages.map(m => ({
        _id: m._id,
        type: 'message',
        room: m.room,
        content: m.content,
        createdAt: m.createdAt
      })));
    }

    // Notes
    if (types.includes('notes')) {
      const filter = { room: { $in: roomIds } };
      if (regex) filter.$or = [ { title: regex }, { description: regex } ];
      if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;
      const notes = await Note.find(filter).limit(limit).skip((page-1)*limit);
      results.push(...notes.map(n => ({
        _id: n._id,
        type: 'note',
        room: n.room,
        title: n.title,
        description: n.description,
        createdAt: n.createdAt
      })));
    }

    // Tasks
    if (types.includes('tasks')) {
      const filter = { room: { $in: roomIds } };
      if (regex) filter.$or = [ { title: regex }, { description: regex } ];
      if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;
      const tasks = await Task.find(filter).limit(limit).skip((page-1)*limit);
      results.push(...tasks.map(t => ({
        _id: t._id,
        type: 'task',
        room: t.room,
        title: t.title,
        description: t.description,
        createdAt: t.createdAt
      })));
    }

    // Resources
    if (types.includes('resources')) {
      const filter = { room: { $in: roomIds } };
      if (regex) filter.name = regex;
      if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;
      const resources = await Resource.find(filter).limit(limit).skip((page-1)*limit);
      results.push(...resources.map(r => ({
        _id: r._id,
        type: 'resource',
        room: r.room,
        name: r.name,
        createdAt: r.createdAt
      })));
    }

    // Sort by createdAt desc
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const paginated = results.slice(0, limit);
    res.json({ results: paginated, total: results.length, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
