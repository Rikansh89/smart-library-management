import { useState, useEffect } from 'react';
import { FiBook, FiUsers, FiTrendingUp, FiClock, FiDollarSign, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { adminAPI, analyticsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const statCards = [
  { key: 'totalBooks', label: 'Total Books', icon: FiBook, color: 'bg-blue-500' },
  { key: 'totalUsers', label: 'Total Users', icon: FiUsers, color: 'bg-green-500' },
  { key: 'activeLoans', label: 'Active Loans', icon: FiTrendingUp, color: 'bg-purple-500' },
  { key: 'pendingRequests', label: 'Pending Requests', icon: FiClock, color: 'bg-yellow-500' },
  { key: 'totalFines', label: 'Total Fines Collected', icon: FiDollarSign, color: 'bg-red-500' },
  { key: 'todayIssues', label: 'Today Issues', icon: FiCalendar, color: 'bg-indigo-500' },
  { key: 'todayReturns', label: 'Today Returns', icon: FiRefreshCw, color: 'bg-teal-500' },
];

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        adminAPI.getDashboard(),
        analyticsAPI.getFull(),
      ]);
      setStats(dashRes.data);
      setMonthlyTrends(analyticsRes.data?.monthlyTrends || []);
      setRecentActivity(dashRes.data?.recentActivity || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load dashboard data';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Borrows',
        data: monthLabels.map((_, i) => monthlyTrends?.[i]?.count ?? 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Monthly Borrowing Trends', font: { size: 16 } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchDashboard} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <button onClick={fetchDashboard} className="btn-secondary flex items-center gap-2">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="card flex items-center gap-4 p-4">
            <div className={`${color} p-3 rounded-lg text-white`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold">{stats?.[key] ?? 0}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          {monthlyTrends && monthlyTrends.length > 0 ? (
            <Bar data={barData} options={barOptions} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No borrowing data available yet.</p>
            </div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {recentActivity.map((act, i) => (
                <li key={i} className="py-3 flex items-start gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{act.description || act.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {act.user && `${act.user} · `}{act.timestamp ? new Date(act.timestamp).toLocaleString() : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
