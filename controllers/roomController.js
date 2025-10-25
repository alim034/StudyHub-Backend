import Room from "../models/Room.js";
import { isMember, isAdmin } from "../utils/roomAuth.js";

// POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { name, description, visibility } = req.body;
    const room = await Room.create({
      name,
      description,
      visibility,
      admin: req.user._id,
      members: [req.user._id],
    });
    
    // Debug: Log the created room to check if code was generated
    console.log("Created room:", room);
    console.log("Room code:", room.code);
    
    res.json({ success: true, data: room, message: "Room created" });
  } catch (err) {
    console.error("Room creation error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/rooms/join
export const joinByCode = async (req, res) => {
  try {
    const { code } = req.body;
    console.log("Attempting to join room with code:", code);
    
    const room = await Room.findOne({ code });
    console.log("Found room:", room ? `Yes (${room.name})` : "No");
    
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (!isMember(room, req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }
    res.json({ success: true, data: room, message: "Joined room" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/rooms/mine
export const getMyRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [rooms, total] = await Promise.all([
      Room.find({ members: req.user._id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Room.countDocuments({ members: req.user._id }),
    ]);
    res.json({
      success: true,
      data: { rooms, total, page, pages: Math.ceil(total / limit) },
      message: "Fetched rooms",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/rooms/:id
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("admin", "name email").populate("members", "name email");
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (room.visibility === "private" && !isMember(room, req.user._id))
      return res.status(403).json({ success: false, message: "Not authorized" });
    res.json({ success: true, data: room, message: "Fetched room" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (!isAdmin(room, req.user._id))
      return res.status(403).json({ success: false, message: "Only admin can update" });
    const { name, description, visibility } = req.body;
    if (name) room.name = name;
    if (description) room.description = description;
    if (visibility) room.visibility = visibility;
    await room.save();
    res.json({ success: true, data: room, message: "Room updated" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (!isAdmin(room, req.user._id))
      return res.status(403).json({ success: false, message: "Only admin can delete" });
    await room.deleteOne();
    res.json({ success: true, message: "Room deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/rooms/:id/invite/regenerate
export const regenerateInvite = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (!isAdmin(room, req.user._id))
      return res.status(403).json({ success: false, message: "Only admin can regenerate invite" });
    // Generate new code
    let unique = false;
    let code;
    while (!unique) {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const exists = await Room.findOne({ code });
      if (!exists) unique = true;
    }
    room.code = code;
    await room.save();
    res.json({ success: true, data: { code }, message: "Invite code regenerated" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};