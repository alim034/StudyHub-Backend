import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{ type: String }], // For file URLs
  },
  { timestamps: true }
);

export default mongoose.model('Note', NoteSchema);