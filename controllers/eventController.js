// backend/controllers/eventController.js
import Event from '../models/Event.js';
import Room from '../models/Room.js';
import nodeCron from 'node-cron';

// Create Event
export const createEvent = async (req, res) => {
  try {
    const { title, description, start, end } = req.body;
    const event = new Event({
      title,
      description,
      start,
      end,
      room: req.params.roomId,
      createdBy: req.user.id
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Events (with optional date range)
export const getEvents = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { room: req.params.roomId };
    if (from || to) {
      query.start = {};
      if (from) query.start.$gte = new Date(from);
      if (to) query.start.$lte = new Date(to);
    }
    const events = await Event.find(query).sort({ start: 1 });
    res.json(events);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('room');
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Only creator or room admin can delete
    const isAdmin = event.room.admins?.includes(req.user.id);
    if (event.createdBy.toString() !== req.user.id && !isAdmin)
      return res.status(403).json({ error: 'Not authorized' });

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Reminder stub (node-cron)
nodeCron.schedule('* * * * *', async () => {
  const now = new Date();
  const events = await Event.find({ start: { $lte: now }, end: { $gte: now } });
  events.forEach(event => {
    console.log(`Reminder: Event "${event.title}" is happening now!`);
    // Future: Integrate with notification service
  });
});