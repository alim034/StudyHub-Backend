import Note from '../models/Note.js';

// Create a new note
export const createNote = async (req, res) => {
  try {
    const { title, content, attachments } = req.body;
    const note = await Note.create({
      title,
      content,
      attachments: attachments || [],
      user: req.user.userId,
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note', error: error.message });
  }
};

// Get all notes (with search & pagination)
export const getNotes = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const query = {};

    // Admin sees all notes, user sees only their notes
    if (req.user.role !== 'admin') {
      query.user = req.user.userId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const notes = await Note.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
};

// Get a single note by ID
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('user', 'name email');
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Only owner or admin can view
    if (req.user.role !== 'admin' && note.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch note', error: error.message });
  }
};

// Update a note (only owner)
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Only owner can update
    if (note.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;
    note.attachments = req.body.attachments || note.attachments;

    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update note', error: error.message });
  }
};

// Delete a note (owner or admin)
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Only owner or admin can delete
    if (note.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete note', error: error.message });
  }
};