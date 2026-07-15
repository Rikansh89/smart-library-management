import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket = null;

export const connectSocket = (userId) => {
  const url = import.meta.env.VITE_SOCKET_URL || '/';
  socket = io(url, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('join', userId);
  });

  socket.on('notification', (notification) => {
    toast(notification?.title || 'New notification', { icon: '🔔' });
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
