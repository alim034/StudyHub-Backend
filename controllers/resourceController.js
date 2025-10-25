import Resource from '../models/Resource.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { sendEmail, sendPush } from '../utils/notify.js';
import fs from 'fs';
import path from 'path';

// Upload resources
export const uploadResources = async (req, res) => {
  try {
    const files = req.files;
    const { tags } = req.body;
    const tagArr = tags ? tags.split(',').map(t => t.trim()) : [];
    const resources = [];

    for (const file of files) {
      const resource = new Resource({
        room: req.params.roomId,
        uploader: req.user.id,
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        type: file.mimetype,
        size: file.size,
        tags: tagArr
      });
      await resource.save();
      resources.push(resource);
    }
    // Notify all room members except uploader
    const room = await Room.findById(req.params.roomId).populate('members');
    const uploader = req.user.id;
    for (const member of room.members) {
      if (member._id.toString() !== uploader) {
        sendEmail({
          to: member.email,
          subject: `New Resources Uploaded`,
          text: `${req.user.name} just added new resources to room "${room.name}".`
        });
        sendPush({
          userId: member._id,
          title: 'New Resources Uploaded',
          body: `${req.user.name} just added new resources to room "${room.name}".`,
          data: { roomId: room._id }
        });
      }
    }
    res.status(201).json(resources);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get resources (with search and pagination)
export const getResources = async (req, res) => {
  try {
    const { search, tags, page = 1, limit = 10 } = req.query;
    const query = { room: req.params.roomId };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (tags) query.tags = { $in: tags.split(',').map(t => t.trim()) };

    const resources = await Resource.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('uploader', 'name email')
      .sort({ createdAt: -1 });

    const total = await Resource.countDocuments(query);
    res.json({ resources, total });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Upload new version
export const uploadNewVersion = async (req, res) => {
  try {
    const file = req.file;
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    // Remove old file
    const oldPath = path.join(process.cwd(), 'public', resource.url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    resource.name = file.originalname;
    resource.url = `/uploads/${file.filename}`;
    resource.type = file.mimetype;
    resource.size = file.size;
    resource.version += 1;
    await resource.save();

    res.json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete resource
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId).populate('room');
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const isAdmin = resource.room.admins?.includes(req.user.id);
    if (resource.uploader.toString() !== req.user.id && !isAdmin)
      return res.status(403).json({ error: 'Not authorized' });

    // Remove file
    const filePath = path.join(process.cwd(), 'public', resource.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await resource.deleteOne();
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};