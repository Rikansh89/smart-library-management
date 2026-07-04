import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiClock } from 'react-icons/fi';
import { reservationAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, [page]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationAPI.getMy({ page, limit: 10 });
      const data = res.data || res;
      setReservations(data.reservations || data || []);
      setTotalPages(data.totalPages || data.pages || 1);
    } catch {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await reservationAPI.cancel(id);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-600',
      pending: 'bg-yellow-100 text-yellow-600',
      cancelled: 'bg-gray-100 text-gray-500',
      fulfilled: 'bg-blue-100 text-blue-600',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          styles[status] || 'bg-gray-100 text-gray-600'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="transition-page p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Reservations</h1>

      {loading ? (
        <LoadingSpinner />
      ) : reservations.length === 0 ? (
        <div className="text-center py-16">
          <FiClock size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">No reservations yet</p>
          <p className="text-gray-400">
            Browse the catalog and reserve a book!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {res.book_title || 'Unknown Book'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {res.author || ''}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>
                      Reserved:{' '}
                      {new Date(res.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(res.status)}
                  {res.status === 'active' && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      disabled={cancelling === res.id}
                      className="btn-danger text-sm px-3 py-1 disabled:opacity-50"
                    >
                      {cancelling === res.id ? '...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
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

export default Reservations;
