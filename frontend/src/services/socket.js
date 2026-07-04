import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket = null;

export const connectSocket = (userId) => {
  socket = io('/', { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('join', userId);
  });

  socket.on('notification', (notification) => {
    toast(notification.title, { icon: '🔔' });
    if (window.__onNotification) {
      window.__onNotification(notification);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
