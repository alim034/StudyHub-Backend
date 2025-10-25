import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  size: { type: Number },
  tags: [{ type: String }],
  version: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model('Resource', resourceSchema);