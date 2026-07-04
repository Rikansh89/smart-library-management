import React, { useState, useEffect } from 'react';
import { issueAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function MyBooks() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadIssues(); }, []);

  const loadIssues = async () => {
    try {
      const res = await issueAPI.getMyIssues();
      setIssues(res.data.books);
    } catch {}
    setLoading(false);
  };

  const handleRenew = async (id) => {
    try {
      await issueAPI.renew({ issued_book_id: id });
      toast.success('Book renewed!');
      loadIssues();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Renewal failed');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Books</h1>

      {issues.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl block mb-4">📚</span>
          <p className="text-lg font-medium text-gray-600 dark:text-dark-300">No books issued yet</p>
          <p className="text-sm text-gray-500 mt-1">Browse the library and issue your first book!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const daysLeft = Math.ceil((new Date(issue.due_date) - new Date()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysLeft < 0;
            return (
              <div key={issue.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      {issue.cover_image ? <img src={`http://localhost:5000${issue.cover_image}`} alt="" className="w-full h-full object-cover rounded-lg" /> : <span className="text-2xl">📕</span>}
                    </div>
                    <div>
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="text-sm text-gray-500">{issue.author}</p>
                      <p className="text-xs text-gray-400 mt-1">Copy: {issue.copy_code} | ISBN: {issue.isbn}</p>
                      <div className="flex gap-3 mt-2 text-sm">
                        <span>Issued: {new Date(issue.issue_date).toLocaleDateString()}</span>
                        <span>Due: {new Date(issue.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`badge ${isOverdue ? 'badge-red' : 'badge-green'}`}>
                      {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                    </span>
                    {issue.status === 'issued' && !isOverdue && issue.renewed_count < 2 && (
                      <button onClick={() => handleRenew(issue.id)} className="btn-secondary text-xs">Renew</button>
                    )}
                    {issue.fine && issue.fine.status === 'pending' && (
                      <span className="text-xs text-red-600 font-medium">Fine: ${issue.fine.amount.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
