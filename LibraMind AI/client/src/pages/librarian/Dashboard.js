import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';

export default function LibrarianDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getLibrarian().then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Librarian Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="Total Books" value={stats.totalBooks} color="blue" />
        <StatCard title="Total Copies" value={stats.totalCopies} color="indigo" />
        <StatCard title="Available" value={stats.availableCopies} color="green" />
        <StatCard title="Issued" value={stats.issuedCopies} color="orange" />
        <StatCard title="Active Issues" value={stats.issuedBooks} color="purple" />
        <StatCard title="Returned Today" value={stats.returnedToday} color="teal" />
        <StatCard title="Overdue" value={stats.overdueCount} color="red" />
        <StatCard title="Reservations" value={stats.pendingReservations} color="yellow" />
      </div>

      {data?.overdueBooks?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-red-600">Overdue Books</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b dark:border-dark-700"><th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Book</th><th className="pb-3 font-medium">Due Date</th><th className="pb-3 font-medium">Days Overdue</th></tr></thead>
              <tbody>
                {data.overdueBooks.map((ob) => {
                  const daysOverdue = Math.ceil((new Date() - new Date(ob.due_date)) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={ob.id} className="border-b dark:border-dark-700 last:border-0">
                      <td className="py-3">{ob.user_name}<br /><span className="text-xs text-gray-500">{ob.student_id}</span></td>
                      <td className="py-3">{ob.title}</td>
                      <td className="py-3">{new Date(ob.due_date).toLocaleDateString()}</td>
                      <td className="py-3 text-red-600 font-medium">{daysOverdue} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data?.pendingReservations?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Pending Reservations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b dark:border-dark-700"><th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Book</th><th className="pb-3 font-medium">Queue Position</th><th className="pb-3 font-medium">Date</th></tr></thead>
              <tbody>
                {data.pendingReservations.map((r) => (
                  <tr key={r.id} className="border-b dark:border-dark-700 last:border-0">
                    <td className="py-3">{r.user_name}</td>
                    <td className="py-3">{r.title}</td>
                    <td className="py-3">#{r.queue_position}</td>
                    <td className="py-3">{new Date(r.reservation_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b dark:border-dark-700"><th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Book</th><th className="pb-3 font-medium">Action</th><th className="pb-3 font-medium">Date</th></tr></thead>
            <tbody>
              {data?.recentActivity?.map((a) => (
                <tr key={a.id} className="border-b dark:border-dark-700 last:border-0">
                  <td className="py-3">{a.user_name}</td>
                  <td className="py-3">{a.title}</td>
                  <td className="py-3">
                    <span className={`badge ${a.status === 'returned' ? 'badge-green' : a.status === 'overdue' ? 'badge-red' : 'badge-blue'}`}>{a.status}</span>
                  </td>
                  <td className="py-3">{new Date(a.issue_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  const colors = { blue: 'border-blue-200 bg-blue-50', green: 'border-green-200 bg-green-50', red: 'border-red-200 bg-red-50', yellow: 'border-yellow-200 bg-yellow-50', purple: 'border-purple-200 bg-purple-50', indigo: 'border-indigo-200 bg-indigo-50', orange: 'border-orange-200 bg-orange-50', teal: 'border-teal-200 bg-teal-50' };
  return (
    <div className={`rounded-xl border ${colors[color] || colors.blue} p-4`}>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}
