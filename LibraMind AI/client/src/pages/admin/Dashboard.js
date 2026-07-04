import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import BarChart from '../../components/Charts/BarChart';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getAdmin().then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  const u = data?.userStats || {};
  const b = data?.bookStats || {};
  const i = data?.issueStats || {};
  const r = data?.revenue || {};

  const chartData = data?.borrowingTrends?.length ? {
    labels: data.borrowingTrends.map(t => t.date),
    datasets: [{
      label: 'Issues',
      data: data.borrowingTrends.map(t => t.count),
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }]
  } : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={u.total} sub={`${u.active} active`} color="blue" />
        <StatCard title="Students" value={u.students} sub={`${u.librarians} librarians`} color="green" />
        <StatCard title="Total Books" value={b.total} color="purple" />
        <StatCard title="Active Issues" value={i.active} sub={`${i.returned} returned`} color="orange" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Collected" value={`$${(r.totalCollected || 0).toFixed(2)}`} color="green" />
        <StatCard title="Pending" value={`$${(r.pendingCollection || 0).toFixed(2)}`} color="red" />
        <StatCard title="Total Fines" value={`$${(r.totalFines || 0).toFixed(2)}`} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Borrowing Trends (30 days)</h2>
            <BarChart data={chartData} height={250} />
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Most Borrowed Books</h2>
          <div className="space-y-3">
            {data?.mostBorrowed?.slice(0, 5).map((book, idx) => (
              <div key={book.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-6">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  <p className="text-xs text-gray-500">{book.author}</p>
                </div>
                <span className="badge-blue">{book.borrow_count} issues</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Registrations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b dark:border-dark-700"><th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium">Email</th><th className="pb-3 font-medium">Role</th><th className="pb-3 font-medium">Joined</th></tr></thead>
            <tbody>
              {data?.recentRegistrations?.map((u) => (
                <tr key={u.id} className="border-b dark:border-dark-700 last:border-0">
                  <td className="py-3">{u.name}</td>
                  <td className="py-3 text-gray-500">{u.email}</td>
                  <td className="py-3"><span className="badge capitalize">{u.role}</span></td>
                  <td className="py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, color }) {
  const colors = { blue: 'border-blue-200 bg-blue-50', green: 'border-green-200 bg-green-50', red: 'border-red-200 bg-red-50', yellow: 'border-yellow-200 bg-yellow-50', purple: 'border-purple-200 bg-purple-50', orange: 'border-orange-200 bg-orange-50' };
  return (
    <div className={`rounded-xl border ${colors[color] || colors.blue} p-4`}>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
      <p className="text-sm text-gray-600">{title}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
