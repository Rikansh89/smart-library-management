import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiBook } from 'react-icons/fi';
import { issueAPI, fineAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const TABS = ['All', 'Issued', 'Returned'];

function MyBooks() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unpaidFines, setUnpaidFines] = useState(0);

  useEffect(() => {
    fetchIssues();
    fetchFines();
  }, [activeTab, page]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const status =
        activeTab === 'All' ? '' : activeTab.toLowerCase();
      const res = await issueAPI.getMy({ status, page, limit: 10 });
      const data = res.data || res;
      setIssues(data.issues || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Failed to load your books');
    } finally {
      setLoading(false);
    }
  };

  const fetchFines = async () => {
    try {
      const res = await fineAPI.getTotalUnpaid();
      const data = res.data || res;
      setUnpaidFines(data.total || 0);
    } catch {
      // Silently fail for fines
    }
  };

  const getOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getStatusBadge = (issue) => {
    if (issue.status === 'returned') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Returned
        </span>
      );
    }
    const overdue = getOverdueDays(issue.due_date);
    if (overdue > 0) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
          Overdue ({overdue}d)
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
        Issued
      </span>
    );
  };

  return (
    <div className="transition-page p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Books</h1>
        {unpaidFines > 0 && (
          <div className="mt-2 sm:mt-0 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <p className="text-sm text-red-600 font-medium">
              Unpaid Fines: ${unpaidFines.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : issues.length === 0 ? (
        <div className="text-center py-16">
          <FiBook size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">No books found</p>
          <p className="text-gray-400">
            {activeTab === 'All'
              ? "You haven't borrowed any books yet"
              : `No ${activeTab.toLowerCase()} books`}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {issues.map((issue) => {
              const overdue = getOverdueDays(issue.dueDate);
              return (
                <div
                  key={issue.id}
                  className={`card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    overdue > 0
                      ? 'border-red-200 bg-red-50'
                      : ''
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {issue.book_title || 'Unknown Book'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {issue.author || ''}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                      <span>
                        Issued:{' '}
                        {new Date(
                          issue.issue_date || issue.created_at
                        ).toLocaleDateString()}
                      </span>
                      {issue.due_date && (
                        <span>
                          Due:{' '}
                          {new Date(issue.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {issue.return_date && (
                        <span>
                          Returned:{' '}
                          {new Date(
                            issue.return_date
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(issue)}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

export default MyBooks;
