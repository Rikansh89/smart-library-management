import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiBook, FiClock, FiCheckCircle, FiAlertCircle, FiPlus, FiSettings } from 'react-icons/fi';
import { issueAPI, bookAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    issuedBooks: 0,
    overdueBooks: 0,
    totalBooks: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [pendingRes, issuedRes, allBooksRes, overdueRes, recentIssuesRes] = await Promise.all([
        issueAPI.getAll({ status: 'pending', limit: 100 }),
        issueAPI.getAll({ status: 'issued', limit: 100 }),
        bookAPI.getAll({ limit: 1 }),
        issueAPI.getAll({ status: 'overdue', limit: 100 }),
        issueAPI.getAll({ limit: 5 }),
      ]);

      setPendingRequests(pendingRes.data?.issues || pendingRes.data?.data || []);
      setStats({
        pendingRequests: pendingRes.data?.total || pendingRes.data?.issues?.length || 0,
        issuedBooks: issuedRes.data?.total || issuedRes.data?.issues?.length || 0,
        overdueBooks: overdueRes.data?.total || overdueRes.data?.issues?.length || 0,
        totalBooks: allBooksRes.data?.total || 0,
      });
      setRecentActivity(recentIssuesRes.data?.issues || recentIssuesRes.data?.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await issueAPI.approveIssue(id);
      toast.success('Issue approved successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve issue');
    }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      label: 'Pending Requests',
      value: stats.pendingRequests,
      icon: FiClock,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      iconBg: 'bg-yellow-100',
    },
    {
      label: 'Issued Books',
      value: stats.issuedBooks,
      icon: FiBook,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Overdue Books',
      value: stats.overdueBooks,
      icon: FiAlertCircle,
      color: 'bg-red-50 text-red-600 border-red-200',
      iconBg: 'bg-red-100',
    },
    {
      label: 'Total Books',
      value: stats.totalBooks,
      icon: FiCheckCircle,
      color: 'bg-green-50 text-green-600 border-green-200',
      iconBg: 'bg-green-100',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name || 'Librarian'}</h1>
        <p className="text-gray-500">Smart Library Management Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.iconBg}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/librarian/books?action=add"
              className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              <span className="font-medium">Add Book</span>
            </Link>
            <Link
              to="/librarian/issues"
              className="flex items-center gap-3 p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <FiSettings className="w-5 h-5" />
              <span className="font-medium">Manage Issues</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Approvals</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{req.book_title || 'Unknown Book'}</p>
                      <p className="text-sm text-gray-500 truncate">{req.user_name || req.user_email || 'Unknown User'}</p>
                    </div>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="ml-3 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                  >
                    Approve
                  </button>
                </div>
              ))}
              {pendingRequests.length > 5 && (
                <Link to="/librarian/issues" className="block text-center text-sm text-indigo-600 hover:underline mt-2">
                  View all
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No recent activity</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Book</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{item.user_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-800">{item.book_title || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'issued' ? 'bg-green-100 text-green-700' :
                        item.status === 'returned' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{new Date(item.issue_date || item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
