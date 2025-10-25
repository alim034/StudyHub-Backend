import cron from 'node-cron';
import Task from '../models/Task.js';
import Event from '../models/Event.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { sendEmail, sendPush } from '../utils/notify.js';

// Run every minute
cron.schedule('*/1 * * * *', async () => {
  const now = new Date();
  const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000);
  const fifteenMinLater = new Date(now.getTime() + 15 * 60 * 1000);

  // Task reminders
  const tasks = await Task.find({
    dueDate: { $gte: now, $lte: fiveMinLater },
    status: { $ne: 'DONE' },
  }).populate('assignee room');
  for (const task of tasks) {
    if (task.assignee && task.room) {
      sendEmail({
        to: task.assignee.email,
        subject: `Task Due Soon: ${task.title}`,
        text: `Your task "${task.title}" in room "${task.room.name}" is due soon.`,
      });
      sendPush({
        userId: task.assignee._id,
        title: 'Task Due Soon',
        body: `Your task "${task.title}" in room "${task.room.name}" is due soon.`,
        data: { taskId: task._id },
      });
    }
  }

  // Event reminders
  const events = await Event.find({
    start: { $gte: now, $lte: fifteenMinLater },
  }).populate('room');
  for (const event of events) {
    if (event.room) {
      // Find all members of the room
      const room = await Room.findById(event.room._id).populate('members');
      for (const member of room.members) {
        sendEmail({
          to: member.email,
          subject: `Event Starting Soon: ${event.title}`,
          text: `Event "${event.title}" in room "${room.name}" starts soon.`,
        });
        sendPush({
          userId: member._id,
          title: 'Event Starting Soon',
          body: `Event "${event.title}" in room "${room.name}" starts soon.`,
          data: { eventId: event._id },
        });
      }
    }
  }
});