import React, { useState, useEffect } from 'react';
import { issueAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function IssueReturn() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [issueForm, setIssueForm] = useState({ user_id: '', book_id: '' });
  const [returnForm, setReturnForm] = useState({ issued_book_id: '' });

  useEffect(() => { loadIssues(); }, [tab]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab !== 'all') params.status = tab;
      const res = await issueAPI.getAll(params);
      setIssues(res.data.books);
    } catch {}
    setLoading(false);
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      await issueAPI.issue({ user_id: parseInt(issueForm.user_id), book_id: parseInt(issueForm.book_id) });
      toast.success('Book issued!');
      setIssueForm({ user_id: '', book_id: '' });
      loadIssues();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Issue failed');
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    try {
      const res = await issueAPI.return({ issued_book_id: parseInt(returnForm.issued_book_id) });
      if (res.data.fine) toast.success(`Book returned. Fine: $${res.data.fine.amount.toFixed(2)}`);
      else toast.success('Book returned!');
      setReturnForm({ issued_book_id: '' });
      loadIssues();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Return failed');
    }
  };

  const handleChange = (e) => setIssueForm({ ...issueForm, [e.target.name]: e.target.value });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issue & Return Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-green-500">→</span> Issue Book</h2>
          <form onSubmit={handleIssue} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">User ID</label><input type="number" name="user_id" value={issueForm.user_id} onChange={handleChange} className="input-field" placeholder="Enter user ID" required /></div>
            <div><label className="block text-sm font-medium mb-1">Book ID</label><input type="number" name="book_id" value={issueForm.book_id} onChange={handleChange} className="input-field" placeholder="Enter book ID" required /></div>
            <button type="submit" className="btn-primary w-full">Issue Book</button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-red-500">←</span> Return Book</h2>
          <form onSubmit={handleReturn} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Issue Record ID</label><input type="number" value={returnForm.issued_book_id} onChange={(e) => setReturnForm({ issued_book_id: e.target.value })} className="input-field" placeholder="Enter issue record ID" required /></div>
            <button type="submit" className="btn-danger w-full">Return Book</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold">Issue Records</h2>
          <div className="flex gap-2">
            {['all', 'issued', 'returned', 'overdue'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded-full capitalize ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300'}`}>{t}</button>
            ))}
          </div>
        </div>

        {loading ? <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b dark:border-dark-700"><th className="pb-3 font-medium">ID</th><th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Book</th><th className="pb-3 font-medium hidden sm:table-cell">Copy</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Due Date</th></tr></thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id} className="border-b dark:border-dark-700 last:border-0">
                    <td className="py-3 font-mono text-xs">{i.id}</td>
                    <td className="py-3">{i.user_name}<br /><span className="text-xs text-gray-500">{i.student_id}</span></td>
                    <td className="py-3">{i.title}</td>
                    <td className="py-3 hidden sm:table-cell font-mono text-xs">{i.copy_code}</td>
                    <td className="py-3"><span className={`badge ${i.status === 'returned' ? 'badge-green' : i.status === 'overdue' ? 'badge-red' : 'badge-blue'}`}>{i.status}</span></td>
                    <td className="py-3">{new Date(i.due_date).toLocaleDateString()}</td>
                  </tr>
                ))}
                {issues.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-gray-500">No records found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
