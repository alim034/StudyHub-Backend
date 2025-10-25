import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
// NOTE: jobs are imported dynamically AFTER DB connection below to avoid
// running scheduled tasks before Mongoose connects (prevents buffering timeouts)
import whiteboardRoutes from './routes/whiteboardRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { socketAuthMiddleware } from './middlewares/socketAuthMiddleware.js';
import initializeSocket from './socketHandler.js';
import resourceRoutes from './routes/resourceRoutes.js';
import { uploadDir } from './middlewares/uploadMiddleware.js';
import videoRoutes from './routes/videoRoutes.js';
import contactRoutes from './routes/contactRoutes.js'; // ✅ CHANGED: Use import instead of require

// Connect DB and then initialize jobs that rely on the DB connection.
// We intentionally import the job modules dynamically after a successful
// connection so they do not execute queries while mongoose is still
// buffering (which caused "buffering timed out" errors).


// connectDB()
//     .then(() => {
//         // dynamically load jobs now that DB is ready
//         import('./jobs/reminderScheduler.js').catch((err) => console.error('Failed to load reminderScheduler', err));
//         import('./jobs/invitationCleaner.js').catch((err) => console.error('Failed to load invitationCleaner', err));
//     })
//     .catch((err) => {
//         console.error('Failed to connect to DB:', err);
//     });

let isConnected = false;

async function connectToMongoDB() {
    if (isConnected) {
        console.log('MongoDB is already connected.');
        return;
    }

    try {
        await connectDB();
        isConnected = true;
        console.log('Connected to MongoDB successfully.');      
        // dynamically load jobs now that DB is ready
        import('./jobs/reminderScheduler.js').catch((err) => console.error('Failed to load reminderScheduler', err));
        import('./jobs/invitationCleaner.js').catch((err) => console.error('Failed to load invitationCleaner', err));
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }   
}

const app = express();

// add middleware: ensure DB connection before handling requests
// NOTE: this must run after `app` exists (moved here to avoid
// "Cannot access 'app' before initialization" errors during startup).
app.use(async (req, res, next) => {
    if (!isConnected) {
        await connectToMongoDB();
    }
    next();
});

const allowedOrigins = [
  "http://localhost:5173",
  "https://study-hub-frontend-ebon.vercel.app"
];

// --- 1. Centralized CORS Configuration ---
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// --- 2. Apply CORS to Express ---
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads so profile images and other files are accessible.
// Use the configured uploadDir (may be a tmpdir in production) so we
// don't attempt to write into the project root on read-only hosts.
app.use('/uploads', express.static(uploadDir));
app.use('/public', express.static('public'));

// ✅ FIXED: Use the imported contactRoutes
app.use('/api', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'StudyHub backend is running.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', noteRoutes);
app.use('/api', commentRoutes);
app.use('/api/rooms', authMiddleware, roomRoutes);
app.use('/api/rooms/:roomId/tasks', taskRoutes);
app.use('/api', messageRoutes);

// resource routes
app.use('/api/rooms/:roomId/resources', resourceRoutes);

// videos routes
app.use('/api/rooms/:roomId/videos', videoRoutes);

// ✅ FIX: Mount the event routes correctly with a base path.
// Assumes eventRoutes is an Express Router instance.
app.use('/api/rooms/:roomId/events', authMiddleware, eventRoutes);
app.use('/api/rooms/:roomId/board', whiteboardRoutes);
app.use(invitationRoutes);
app.use('/api', searchRoutes);

// --- 3. Create HTTP Server + Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions,
});

// ✅ Attach socket authentication middleware
io.use(socketAuthMiddleware);

// ✅ Then initialize your socket event handlers
initializeSocket(io);

// --- 4. Start server ---
// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
export default app;