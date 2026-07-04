import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiBook, FiClock, FiDollarSign, FiBell, FiSearch, FiCalendar, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  issueAPI,
  fineAPI,
  reservationAPI,
  notificationAPI,
  recommendationAPI,
} from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeLoans: 0,
    reservations: 0,
    pendingFines: 0,
    unreadNotifications: 0,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [issuesRes, finesRes, reservationsRes, notificationsRes, recsRes] =
        await Promise.all([
          issueAPI.getMy({ status: 'issued', limit: 5 }),
          fineAPI.getTotalUnpaid(),
          reservationAPI.getMy({ limit: 5 }),
          notificationAPI.getAll({ limit: 1 }),
          recommendationAPI.get(),
        ]);

      const issuesData = issuesRes.data || issuesRes;
      const finesData = finesRes.data || finesRes;
      const reservationsData = reservationsRes.data || reservationsRes;
      const notificationsData = notificationsRes.data || notificationsRes;
      const recsData = recsRes.data || recsRes;

      setStats({
        activeLoans: issuesData.total || 0,
        reservations: reservationsData.total || 0,
        pendingFines: finesData.total || 0,
        unreadNotifications:
          notificationsData.unreadCount || notificationsData.count || 0,
      });

      const recs = recsData.recommendations || recsData.books || recsData || [];
      setRecommendations(Array.isArray(recs) ? recs : []);
      setRecentActivity(
        issuesData.issues?.slice(0, 5) || []
      );
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      label: 'Active Loans',
      value: stats.activeLoans,
      icon: FiBook,
      color: 'bg-blue-500',
      link: '/student/my-books',
    },
    {
      label: 'Reservations',
      value: stats.reservations,
      icon: FiClock,
      color: 'bg-purple-500',
      link: '/student/reservations',
    },
    {
      label: 'Pending Fines',
      value: `$${stats.pendingFines.toFixed(2)}`,
      icon: FiDollarSign,
      color: 'bg-red-500',
      link: '/student/my-books',
    },
    {
      label: 'Notifications',
      value: stats.unreadNotifications,
      icon: FiBell,
      color: 'bg-green-500',
      link: '/student/notifications',
    },
  ];

  const quickActions = [
    {
      label: 'Browse Books',
      icon: FiSearch,
      link: '/student/books',
      color: 'bg-indigo-500',
    },
    {
      label: 'My Books',
      icon: FiBook,
      link: '/student/my-books',
      color: 'bg-blue-500',
    },
    {
      label: 'Book Room',
      icon: FiCalendar,
      link: '/student/study-room',
      color: 'bg-teal-500',
    },
    {
      label: 'Digital Library',
      icon: FiUsers,
      link: '/student/digital-library',
      color: 'bg-orange-500',
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="transition-page p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome, {user?.name || 'Student'}!
      </h1>
      <p className="text-gray-500 mb-8">Here is your library overview</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.link)}
              className="card p-6 flex items-center gap-4 hover:shadow-lg transition-shadow text-left"
            >
              <div className={`${card.color} p-4 rounded-lg text-white`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            AI Recommendations
          </h2>
          {recommendations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No recommendations yet. Start browsing books!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.slice(0, 4).map((rec, idx) => (
                <button
                  key={rec.id || idx}
                  onClick={() =>
                    navigate(`/student/books/${rec.id}`)
                  }
                  className="bg-gray-50 rounded-lg p-4 text-left hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-800 truncate">
                    {rec.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {rec.author || 'Unknown author'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No recent activity
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentActivity.map((item, idx) => (
                <li key={item.id || idx} className="py-3">
                  <p className="text-sm font-medium text-gray-800">
                    {item.book_title || 'Book'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Issued: {new Date(item.issue_date || item.created_at).toLocaleDateString()}
                  </p>
                  {item.due_date && (
                    <p className="text-xs text-gray-400">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.link)}
                className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}
              >
                <Icon size={24} />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
