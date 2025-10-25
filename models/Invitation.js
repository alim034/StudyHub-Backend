import mongoose from 'mongoose';
import crypto from 'crypto';

const invitationSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true },
  role: { type: String, default: 'member' },
  token: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  expiresAt: { type: Date },
}, { timestamps: true });

invitationSchema.pre('validate', function(next) {
  if (!this.token) {
    this.token = crypto.randomBytes(24).toString('hex');
  }
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  next();
});

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;