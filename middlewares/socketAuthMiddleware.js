import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // This is the line that caused the error. The secret key must be correct.
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user; // Attach user to the socket object
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Invalid token."));
  }
};