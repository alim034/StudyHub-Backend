import mongoose from 'mongoose';

const whiteboardSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, unique: true },
    data: { type: Object }, // { elements, appState }
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);
export default Whiteboard;
