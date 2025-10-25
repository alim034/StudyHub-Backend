// backend/models/Event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

eventSchema.index({ room: 1, start: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;