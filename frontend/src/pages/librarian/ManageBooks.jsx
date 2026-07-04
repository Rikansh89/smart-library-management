import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { bookAPI } from '../../services/api';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const initialForm = {
  title: '',
  author: '',
  isbn: '',
  category: '',
  publication_year: '',
  quantity: 1,
  description: '',
};

const ManageBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [coverImage, setCoverImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, search, category]);

  const fetchCategories = async () => {
    try {
      const res = await bookAPI.getCategories();
      setCategories(res.data?.categories || res.data?.data || []);
    } catch {
      // ignore
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await bookAPI.getAll(params);
      const data = res.data;
      setBooks(data?.books || data?.data || []);
      setTotalPages(data?.totalPages || Math.ceil((data?.total || 0) / 10) || 1);
    } catch (error) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBook(null);
    setForm(initialForm);
    setCoverImage(null);
    setModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      category: book.category || '',
      publication_year: book.publication_year || book.publicationYear || '',
      quantity: book.quantity || 1,
      description: book.description || '',
    });
    setCoverImage(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      if (editingBook) {
        await bookAPI.update(editingBook.id, formData);
        toast.success('Book updated successfully');
      } else {
        await bookAPI.create(formData);
        toast.success('Book added successfully');
      }
      setModalOpen(false);
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await bookAPI.delete(id);
      toast.success('Book deleted successfully');
      setDeleteConfirm(null);
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete book');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Books</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <FiPlus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search books..." />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="input-field border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No books found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Cover</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Author</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">ISBN</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Qty</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Avail</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {book.cover_image ? (
                        <img src={book.cover_image} alt={book.title} className="w-10 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{book.title}</td>
                    <td className="py-3 px-4 text-gray-600">{book.author}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{book.isbn}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">{book.category}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-800">{book.quantity}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-medium ${(book.available_quantity || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {book.available_quantity || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(book)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(book)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingBook ? 'Edit Book' : 'Add Book'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
            <input type="text" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} required className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Or type custom category" className="input-field w-full border border-gray-300 rounded-lg px-3 py-2 mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
              <input type="number" value={form.publication_year} onChange={(e) => setForm({ ...form, publication_year: e.target.value })} className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} className="w-full" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : editingBook ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageBooks;
