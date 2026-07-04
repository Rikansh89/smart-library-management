import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await dashboardAPI.getStudent();
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name}</h1>
          <p className="text-gray-500 dark:text-dark-400">Here's your library overview</p>
        </div>
        <Link to="/books" className="btn-primary">Browse Books</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Issued Books" value={data?.currentIssues?.length || 0} icon="📖" color="blue" />
        <StatCard title="Returned" value={data?.stats?.returnedBooks || 0} icon="✅" color="green" />
        <StatCard title="Total Fines" value={`$${(data?.totalFines || 0).toFixed(2)}`} icon="💰" color="red" />
        <StatCard title="Completed" value={data?.stats?.completedBooks || 0} icon="⭐" color="purple" />
      </div>

      {data?.currentIssues?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Currently Issued Books</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b dark:border-dark-700"><th className="pb-3 font-medium">Book</th><th className="pb-3 font-medium hidden sm:table-cell">Due Date</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Days Left</th></tr></thead>
              <tbody>
                {data.currentIssues.map((issue) => {
                  const daysLeft = Math.ceil((new Date(issue.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={issue.id} className="border-b dark:border-dark-700 last:border-0">
                      <td className="py-3">
                        <p className="font-medium">{issue.title}</p>
                        <p className="text-xs text-gray-500">{issue.author}</p>
                      </td>
                      <td className="py-3 hidden sm:table-cell">{new Date(issue.due_date).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`badge ${daysLeft < 0 ? 'badge-red' : daysLeft <= 2 ? 'badge-yellow' : 'badge-green'}`}>
                          {daysLeft < 0 ? 'Overdue' : issue.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={daysLeft < 0 ? 'text-red-600 font-medium' : ''}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Reading History</h2>
          {data?.readingHistory?.length > 0 ? (
            <div className="space-y-3">
              {data.readingHistory.map((h) => (
                <div key={h.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">
                  <div className="w-10 h-14 bg-gray-200 dark:bg-dark-700 rounded overflow-hidden flex-shrink-0">
                    {h.cover_image ? <img src={`http://localhost:5000${h.cover_image}`} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">📕</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.title}</p>
                    <p className="text-xs text-gray-500">{h.author}</p>
                  </div>
                  <span className={`badge ${h.completed ? 'badge-green' : 'badge-yellow'}`}>{h.completed ? 'Completed' : 'Reading'}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm">No reading history yet</p>}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">AI Recommendations</h2>
          {data?.recommendations?.length > 0 ? (
            <div className="space-y-3">
              {data.recommendations.slice(0, 5).map((book) => (
                <div key={book.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">
                  <div className="w-10 h-14 bg-gray-200 dark:bg-dark-700 rounded overflow-hidden flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.author}</p>
                  </div>
                  <span className="badge-blue">{book.genre || 'General'}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm">Borrow some books to get recommendations!</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = { blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200', green: 'bg-green-50 dark:bg-green-900/20 border-green-200', red: 'bg-red-50 dark:bg-red-900/20 border-red-200', purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200' };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-600 dark:text-dark-300">{title}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
