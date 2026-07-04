import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getAdmin().then((res) => {
      setUsers(res.data.recentRegistrations || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="text-left p-4 font-medium">ID</th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Joined</th>
                <th className="text-left p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800/50">
                  <td className="p-4 font-mono text-xs">{u.id}</td>
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-gray-500">{u.email}</td>
                  <td className="p-4">
                    <span className={`badge capitalize ${u.role === 'admin' ? 'badge-red' : u.role === 'librarian' ? 'badge-blue' : 'badge-green'}`}>{u.role}</span>
                  </td>
                  <td className="p-4 text-gray-500 hidden sm:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="badge-green">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
