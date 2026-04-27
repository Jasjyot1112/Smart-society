const { Server } = require('socket.io');

let io;
// Map userId -> socketId for direct messaging
const userSocketMap = {};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join personal room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        userSocketMap[userId] = socket.id;
        console.log(`👤 User ${userId} joined room user:${userId}`);
      }
    });

    // Join facility room for real-time booking updates
    socket.on('joinFacility', (facilityId) => {
      socket.join(`facility:${facilityId}`);
    });

    socket.on('leaveFacility', (facilityId) => {
      socket.leave(`facility:${facilityId}`);
    });

    socket.on('disconnect', () => {
      // Clean up userSocketMap
      for (const [userId, socketId] of Object.entries(userSocketMap)) {
        if (socketId === socket.id) {
          delete userSocketMap[userId];
          break;
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Helper: emit event to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Helper: emit event to all admins
const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

// Helper: broadcast to all connected clients
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitToUser, emitToRoom, broadcast };
