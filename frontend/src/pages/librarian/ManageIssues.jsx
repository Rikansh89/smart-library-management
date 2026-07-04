import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheck, FiRotateCcw, FiCamera } from 'react-icons/fi';
import { issueAPI } from '../../services/api';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'issued', label: 'Issued' },
  { key: 'returned', label: 'Returned' },
  { key: '', label: 'All' },
];

const ManageIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [qrInput, setQrInput] = useState('');

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchIssues();
  }, [page, activeTab]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (activeTab) params.status = activeTab;
      const res = await issueAPI.getAll(params);
      const data = res.data;
      setIssues(data?.issues || data?.data || []);
      setTotalPages(data?.totalPages || Math.ceil((data?.total || 0) / 10) || 1);
    } catch (error) {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await issueAPI.approveIssue(id);
      toast.success('Issue approved successfully');
      fetchIssues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve issue');
    }
  };

  const handleReturn = async (id) => {
    try {
      await issueAPI.returnBook(id);
      toast.success('Book returned successfully');
      fetchIssues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return book');
    }
  };

  const handleQrScan = async () => {
    if (!qrInput.trim()) {
      toast.error('Please enter a book ID or QR code');
      return;
    }
    try {
      const res = await issueAPI.getById(qrInput.trim());
      navigate(`/librarian/issues?issueId=${res.data?.id || qrInput.trim()}`);
      toast.success('Issue found');
    } catch {
      toast.error('No issue found for the given ID');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      issued: 'bg-green-100 text-green-700',
      returned: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return `inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Issues</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Scan QR / Enter Book ID"
            className="input-field border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={handleQrScan} className="btn-secondary flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
            <FiCamera className="w-4 h-4" />
            Fetch
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : issues.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No issues found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Book</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Issue Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{issue.user_name || issue.user_email || '-'}</td>
                    <td className="py-3 px-4 text-gray-800">{issue.book_title || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {issue.issue_date ? new Date(issue.issue_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {issue.due_date ? new Date(issue.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={getStatusBadge(issue.status)}>{issue.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {issue.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(issue.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FiCheck className="w-3 h-3" />
                            Approve
                          </button>
                        )}
                        {(issue.status === 'issued' || issue.status === 'overdue') && (
                          <button
                            onClick={() => handleReturn(issue.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <FiRotateCcw className="w-3 h-3" />
                            Return
                          </button>
                        )}
                        {issue.status === 'returned' && (
                          <span className="text-xs text-gray-400">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default ManageIssues;
