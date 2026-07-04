import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

export default function Settings() {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [fineRate, setFineRate] = useState('');
  const [settingsForm, setSettingsForm] = useState({ maxBorrowDays: 14, maxBooksPerUser: 5 });
  const [savingFine, setSavingFine] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const envRate = import.meta.env?.VITE_FINE_RATE_PER_DAY || '0.50';
    setFineRate(envRate);
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [logsPage]);

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const res = await adminAPI.getLogs({ page: logsPage, limit: 15 });
      setLogs(res.data?.logs ?? res.data?.data ?? []);
      setLogsTotalPages(res.data?.totalPages ?? res.data?.pagination?.totalPages ?? 1);
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoadingLogs(false);
    }
  }

  function handleFineSave(e) {
    e.preventDefault();
    setSavingFine(true);
    setTimeout(() => {
      toast.success(`Fine rate updated to $${parseFloat(fineRate).toFixed(2)} (UI only — not persisted)`);
      setSavingFine(false);
    }, 400);
  }

  function handleSettingsSave(e) {
    e.preventDefault();
    if (!settingsForm.maxBorrowDays || !settingsForm.maxBooksPerUser) {
      toast.error('All fields are required');
      return;
    }
    setSavingSettings(true);
    setTimeout(() => {
      toast.success('Settings saved (UI only — not wired to backend)');
      setSavingSettings(false);
    }, 400);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Fine Rate Configuration</h2>
            <form onSubmit={handleFineSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fine Rate ($ per day)</label>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field flex-1"
                    value={fineRate}
                    onChange={e => setFineRate(e.target.value)}
                  />
                  <span className="text-sm text-gray-400">/ day</span>
                </div>
              </div>
              <button type="submit" disabled={savingFine} className="btn-primary flex items-center gap-2">
                <FiSave /> {savingFine ? 'Saving...' : 'Update Fine Rate'}
              </button>
              <p className="text-xs text-gray-400 mt-1">Current rate from environment: ${import.meta.env?.VITE_FINE_RATE_PER_DAY || '0.50'}/day</p>
            </form>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-lg font-semibold mb-4">Borrowing Settings</h2>
            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Borrow Days</label>
                <input
                  type="number"
                  min="1"
                  className="input-field w-full"
                  value={settingsForm.maxBorrowDays}
                  onChange={e => setSettingsForm(f => ({ ...f, maxBorrowDays: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Books Per User</label>
                <input
                  type="number"
                  min="1"
                  className="input-field w-full"
                  value={settingsForm.maxBooksPerUser}
                  onChange={e => setSettingsForm(f => ({ ...f, maxBooksPerUser: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <button type="submit" disabled={savingSettings} className="btn-primary flex items-center gap-2">
                <FiSave /> {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-4">System Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Application Version</span>
              <span className="font-medium">{import.meta.env?.VITE_APP_VERSION || '1.0.0'}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Build Date</span>
              <span className="font-medium">{import.meta.env?.BUILD_DATE ? new Date(import.meta.env.BUILD_DATE).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Environment</span>
              <span className="font-medium capitalize">{import.meta.env?.MODE || 'development'}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">API Base URL</span>
              <span className="font-medium text-sm truncate max-w-[200px]">{import.meta.env?.VITE_API_URL || 'http://localhost:5001/api'}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">System Uptime</span>
              <span className="font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Activity Logs</h2>
          <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2 text-sm">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
        {loadingLogs ? (
          <LoadingSpinner />
        ) : logs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No activity logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left bg-gray-50">
                  <th className="p-3 font-medium text-gray-600">User</th>
                  <th className="p-3 font-medium text-gray-600">Action</th>
                  <th className="p-3 font-medium text-gray-600">Details</th>
                  <th className="p-3 font-medium text-gray-600 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium">{log.user_name || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">{log.details || '-'}</td>
                    <td className="p-3 text-gray-500 text-right whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {logsTotalPages > 1 && (
          <div className="mt-4">
            <Pagination currentPage={logsPage} totalPages={logsTotalPages} onPageChange={setLogsPage} />
          </div>
        )}
      </div>
    </div>
  );
}
