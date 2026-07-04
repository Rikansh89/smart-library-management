import React, { useState, useEffect } from 'react';
import { booksAPI, issueAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/Common/Modal';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [genres, setGenres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    loadBooks();
    loadFilters();
  }, [page, genre, category]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (genre) params.genre = genre;
      if (category) params.category = category;
      const res = await booksAPI.getAll(params);
      setBooks(res.data.books);
      setTotalPages(res.data.totalPages);
    } catch {}
    setLoading(false);
  };

  const loadFilters = async () => {
    try {
      const [gRes, cRes] = await Promise.all([booksAPI.getGenres(), booksAPI.getCategories()]);
      setGenres(gRes.data.genres);
      setCategories(cRes.data.categories);
    } catch {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadBooks();
  };

  const handleIssue = async (bookId) => {
    try {
      await issueAPI.issue({ book_id: bookId, user_id: JSON.parse(localStorage.getItem('user')).id });
      toast.success('Book issued successfully!');
      setSelectedBook(null);
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue book');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Books</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, author, or ISBN..." className="input-field flex-1 min-w-[200px]" />
        <select value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1); }} className="select-field w-40">
          <option value="">All Genres</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="select-field w-44">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book) => (
              <div key={book.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBook(book)}>
                <div className="w-full h-48 bg-gray-100 dark:bg-dark-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {book.cover_image ? (
                    <img src={`http://localhost:5000${book.cover_image}`} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">📕</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm truncate">{book.title}</h3>
                <p className="text-xs text-gray-500 dark:text-dark-400 truncate">{book.author}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="badge-blue text-xs">{book.genre || 'General'}</span>
                  <span className={`text-xs font-medium ${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {book.available_copies > 0 ? `${book.available_copies} available` : 'Unavailable'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm">Previous</button>
              <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm">Next</button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!selectedBook} onClose={() => setSelectedBook(null)} title={selectedBook?.title || ''} size="lg">
        {selectedBook && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-32 h-44 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {selectedBook.cover_image ? <img src={`http://localhost:5000${selectedBook.cover_image}`} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl">📕</span>}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-gray-500">by {selectedBook.author}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge-blue">{selectedBook.genre || 'N/A'}</span>
                  <span className="badge-gray">{selectedBook.category || 'N/A'}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-dark-300">{selectedBook.description || 'No description available.'}</p>
                <p className="text-xs text-gray-400">ISBN: {selectedBook.isbn}</p>
                <p className="text-xs text-gray-400">Copies: {selectedBook.total_copies} total, {selectedBook.available_copies} available</p>
              </div>
            </div>
            <button onClick={() => handleIssue(selectedBook.id)} disabled={selectedBook.available_copies < 1} className="btn-primary w-full">
              {selectedBook.available_copies < 1 ? 'No Copies Available' : 'Issue This Book'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
