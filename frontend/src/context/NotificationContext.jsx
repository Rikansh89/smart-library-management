import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationAPI } from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      const { data } = await notificationAPI.getAll({ page, limit: 20 });
      const list = data?.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch { }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getUnreadCount();
      setUnreadCount(data.count);
    } catch { }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { }
  }, []);

  useEffect(() => {
    window.__onNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    return () => { window.__onNotification = null; };
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      fetchNotifications, fetchUnreadCount,
      markAsRead, markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
