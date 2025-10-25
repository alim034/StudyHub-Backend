import cron from 'node-cron';
import Invitation from '../models/Invitation.js';

// Run once a day at midnight
cron.schedule('0 0 * * *', async () => {
  const now = new Date();
  const expired = await Invitation.updateMany(
    { status: 'pending', expiresAt: { $lt: now } },
    { status: 'expired' }
  );
  if (expired.modifiedCount > 0) {
    console.log(`[INVITE CLEANER] Expired ${expired.modifiedCount} invitations.`);
  }
});