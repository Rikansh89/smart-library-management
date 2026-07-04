import React, { useState, useEffect } from 'react';
import { issueAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReservations(); }, []);

  const loadReservations = async () => {
    try {
      const res = await issueAPI.getReservations({ status: 'pending' });
      setReservations(res.data.reservations);
    } catch {}
    setLoading(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await issueAPI.cancelReservation(id);
      toast.success('Reservation cancelled');
      loadReservations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Reservations</h1>

      {reservations.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl block mb-4">📋</span>
          <p className="text-lg font-medium text-gray-600 dark:text-dark-300">No pending reservations</p>
          <p className="text-sm text-gray-500 mt-1">All reservations are fulfilled.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr><th className="text-left p-4 font-medium">User</th><th className="text-left p-4 font-medium">Book</th><th className="text-left p-4 font-medium hidden sm:table-cell">Queue #</th><th className="text-left p-4 font-medium hidden md:table-cell">Reserved On</th><th className="text-left p-4 font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-t dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="p-4">User #{r.user_id}</td>
                    <td className="p-4">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.author}</p>
                    </td>
                    <td className="p-4 hidden sm:table-cell"><span className="badge-blue">#{r.queue_position}</span></td>
                    <td className="p-4 hidden md:table-cell text-gray-500">{new Date(r.reservation_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <button onClick={() => handleCancel(r.id)} className="text-xs px-3 py-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
