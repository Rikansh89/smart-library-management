import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiBell, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { notificationAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ page, limit: 20 });
      const data = res.data || res;
      setNotifications(data.notifications || data || []);
      setTotalPages(data.totalPages || data.pages || 1);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationAPI.markAllAsRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  return (
    <div className="transition-page p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-secondary text-sm mt-2 sm:mt-0 disabled:opacity-50"
          >
            {markingAll ? '...' : 'Mark All as Read'}
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <FiBell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">No notifications</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  if (!notification.is_read) handleMarkRead(notification.id);
                }}
                className={`card p-4 w-full text-left transition-colors ${
                  !notification.is_read
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(
                        notification.created_at
                      ).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <FiCheck
                      size={18}
                      className="text-indigo-400 mt-1 flex-shrink-0"
                    />
                  )}
                  {notification.is_read && (
                    <FiCheckCircle
                      size={18}
                      className="text-gray-300 mt-1 flex-shrink-0"
                    />
                  )}
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Notifications;
