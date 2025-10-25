import mongoose from 'mongoose';

const videoSessionSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, unique: true },
  url: { type: String },
  lastPositionSec: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('VideoSession', videoSessionSchema);