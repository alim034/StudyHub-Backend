import Task from '../models/Task.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import mongoose from 'mongoose'; // Added this missing import
import { sendEmail, sendPush } from '../utils/notify.js';

// Helper: check if user is admin or creator
const isAdminOrCreator = (user, room, task) => {
  return room.admin.equals(user._id) || task.createdBy.equals(user._id);
};

export const createTask = async (req, res) => {
  try {
    const { title, description, status, assignee, dueAt } = req.body;
    const { roomId } = req.params;
    const task = new Task({
      room: roomId,
      title,
      description,
      status,
      assignee,
      dueAt,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    await task.save();
    await task.populate('assignee', 'name email profilePicture');
    await task.populate('createdBy', 'name profilePicture');
    // Notify assignee
    if (task.assignee && task.assignee.email) {
      const room = await Room.findById(roomId);
      sendEmail({
        to: task.assignee.email,
        subject: `New Task Assigned: ${task.title}`,
        text: `You have been assigned a new task: "${task.title}" in room "${room?.name}".`
      });
      sendPush({
        userId: task.assignee._id,
        title: 'New Task Assigned',
        body: `You have been assigned a new task: "${task.title}" in room "${room?.name}".`,
        data: { taskId: task._id }
      });
    }
    res.status(201).json({ task });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getTasksInRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status, assignee, search, page = 1, limit = 10 } = req.query;
    const filter = { room: roomId };
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(filter)
      .populate('assignee', 'name profilePicture')
      .populate('createdBy', 'name profilePicture')
      .sort({ dueAt: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Task.countDocuments(filter);
    res.json({ tasks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { roomId, taskId } = req.params;
    const updates = req.body;
    const task = await Task.findOne({ _id: taskId, room: roomId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const room = await Room.findById(roomId);
    // Only admin or creator can change assignee
    if (updates.assignee && !isAdminOrCreator(req.user, room, task)) {
      return res.status(403).json({ message: 'Only admin or creator can change assignee' });
    }
    // Any member can update other fields
    ['title', 'description', 'status', 'dueAt'].forEach(field => {
      if (updates[field] !== undefined) task[field] = updates[field];
    });
    if (updates.assignee !== undefined) task.assignee = updates.assignee;
    task.updatedBy = req.user._id;
    await task.save();
    await task.populate('assignee', 'name profilePicture');
    await task.populate('createdBy', 'name profilePicture');
    res.json({ task });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { roomId, taskId } = req.params;
    const task = await Task.findOne({ _id: taskId, room: roomId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const room = await Room.findById(roomId);
    if (!isAdminOrCreator(req.user, room, task)) {
      return res.status(403).json({ message: 'Only admin or creator can delete task' });
    }
    await task.deleteOne();
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getTaskSummary = async (req, res) => {
  try {
    const { roomId } = req.params;
    const summary = await Task.aggregate([
      { $match: { room: new mongoose.Types.ObjectId(roomId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts = { PENDING: 0, IN_PROGRESS: 0, DONE: 0 };
    let total = 0;
    summary.forEach(s => {
      counts[s._id] = s.count;
      total += s.count;
    });
    const completionPercentage = total ? Math.round((counts.DONE / total) * 100) : 0;
    res.json({ counts, completionPercentage });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};