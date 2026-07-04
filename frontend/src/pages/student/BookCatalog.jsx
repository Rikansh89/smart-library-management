import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiBookOpen } from 'react-icons/fi';
import { bookAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';

function BookCatalog() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, category, page]);

  const fetchCategories = async () => {
    try {
      const res = await bookAPI.getCategories();
      const data = res.data || res;
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch {
      // silently fail
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;

      const res = await bookAPI.getAll(params);
      const data = res.data || res;
      setBooks(data.books || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearch(query);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="transition-page p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Book Catalog</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Search by title, author, or ISBN..."
            onSearch={handleSearch}
          />
        </div>
        <select
          value={category}
          onChange={handleCategoryChange}
          className="input-field sm:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : books.length === 0 ? (
        <div className="text-center py-16">
          <FiBookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">No books found</p>
          {search && (
            <p className="text-gray-400">
              Try adjusting your search or filters
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => navigate(`/student/books/${book.id}`)}
                className="card p-4 text-left hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiBookOpen size={40} className="text-gray-300" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 truncate">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-500 truncate">{book.author}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {book.category || 'General'}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      book.available_quantity > 0
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {book.available_quantity > 0 ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}

export default BookCatalog;
