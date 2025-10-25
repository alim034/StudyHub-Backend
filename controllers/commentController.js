import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { sendEmail, sendPush } from '../utils/notify.js';

// Create comment
export const createComment = async (req, res) => {
  try {
    const { noteId, text } = req.body;
    const comment = await Comment.create({
      noteId,
      userId: req.user.userId,
      text,
    });
    // Mention detection: @username
    const mentionMatch = text.match(/@([\w]+)/);
    if (mentionMatch) {
      const username = mentionMatch[1];
      const mentionedUser = await User.findOne({ name: username });
      if (mentionedUser) {
        // Find room name (if needed)
        const room = await Room.findOne({ notes: noteId });
        sendEmail({
          to: mentionedUser.email,
          subject: `You were mentioned in a comment`,
          text: `${req.user.name} mentioned you in room "${room?.name}".`
        });
        sendPush({
          userId: mentionedUser._id,
          title: 'Mentioned in Comment',
          body: `${req.user.name} mentioned you in room "${room?.name}".`,
          data: { noteId }
        });
      }
    }
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create comment', error: error.message });
  }
};

// Get comments for a note (with pagination)
export const getComments = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const comments = await Comment.find({ noteId })
      .populate('userId', 'name profilePic')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Comment.countDocuments({ noteId });
    res.json({
      comments,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

// Delete comment (owner or admin)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (
      comment.userId.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};