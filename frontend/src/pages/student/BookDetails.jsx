import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import { bookAPI, issueAPI, reservationAPI, recommendationAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      const res = await bookAPI.getById(id);
      setBook(res.data || res);
      recommendationAPI.logInteraction(id, 'view').catch(() => {});
    } catch {
      toast.error('Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    setBorrowing(true);
    try {
      await issueAPI.requestIssue(id);
      toast.success('Book issued successfully!');
      fetchBook();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow book');
    } finally {
      setBorrowing(false);
    }
  };

  const handleReserve = async () => {
    setReserving(true);
    try {
      await reservationAPI.create(id);
      toast.success('Book reserved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reserve book');
    } finally {
      setReserving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!book) {
    return (
      <div className="transition-page p-6 text-center py-16">
        <FiBookOpen size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-400 text-lg">Book not found</p>
        <button
          onClick={() => navigate('/student/books')}
          className="btn-primary mt-4 inline-flex items-center gap-2"
        >
          <FiArrowLeft /> Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="transition-page p-6">
      <button
        onClick={() => navigate('/student/books')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <FiArrowLeft /> Back to Catalog
      </button>

      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {book.cover_image ? (
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiBookOpen size={64} className="text-gray-300" />
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-gray-500">{book.author}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  book.available_quantity > 0
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {book.available_quantity > 0 ? 'Available' : 'Out of Stock'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-400">ISBN</p>
                <p className="font-medium text-gray-800">
                  {book.isbn || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Category</p>
                <p className="font-medium text-gray-800">
                  {book.category || 'General'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Published Year</p>
                <p className="font-medium text-gray-800">
                  {book.publication_year || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Available Copies</p>
                <p className="font-medium text-gray-800">
                  {book.available_quantity} / {book.quantity}
                </p>
              </div>
            </div>

            {book.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {book.description}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleBorrow}
                disabled={borrowing || book.available_quantity <= 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {borrowing ? 'Processing...' : 'Borrow'}
              </button>
              <button
                onClick={handleReserve}
                disabled={reserving}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reserving ? 'Processing...' : 'Reserve'}
              </button>
            </div>

            {book.qr_code && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  QR Code
                </h3>
                <img
                  src={book.qr_code}
                  alt="Book QR Code"
                  className="w-32 h-32 object-contain border rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;
