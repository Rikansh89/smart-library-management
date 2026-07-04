const Notification = require('../models/Notification');

let io;

const initSocket = (server) => {
  io = require('socket.io')(server, {
    cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const sendNotification = async (userId, notification) => {
  try {
    const created = await Notification.create(notification);
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        ...notification,
        id: created,
        is_read: false,
        created_at: new Date()
      });
    }
  } catch (error) {
    console.error('Socket notification error:', error);
  }
};

const getIO = () => io;

module.exports = { initSocket, sendNotification, getIO };
