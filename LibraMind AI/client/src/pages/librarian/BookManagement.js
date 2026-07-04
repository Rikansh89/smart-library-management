import React, { useState, useEffect } from 'react';
import { booksAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/Common/Modal';

export default function BookManagement() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState({ isbn: '', title: '', author: '', genre: '', category: '', description: '', publisher: '', published_year: '', pages: '', shelf_location: '', copies: '1' });

  useEffect(() => { loadBooks(); }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await booksAPI.getAll({ limit: 50 });
      setBooks(res.data.books);
    } catch {}
    setLoading(false);
  };

  const openAdd = () => {
    setEditBook(null);
    setForm({ isbn: '', title: '', author: '', genre: '', category: '', description: '', publisher: '', published_year: '', pages: '', shelf_location: '', copies: '1' });
    setShowModal(true);
  };

  const openEdit = (book) => {
    setEditBook(book);
    setForm({ isbn: book.isbn, title: book.title, author: book.author, genre: book.genre || '', category: book.category || '', description: book.description || '', publisher: book.publisher || '', published_year: book.published_year?.toString() || '', pages: book.pages?.toString() || '', shelf_location: book.shelf_location || '', copies: '1' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editBook) {
        await booksAPI.update(editBook.id, form);
        toast.success('Book updated!');
      } else {
        await booksAPI.add(form);
        toast.success('Book added!');
      }
      setShowModal(false);
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await booksAPI.delete(id);
      toast.success('Book deleted');
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Management</h1>
        <button onClick={openAdd} className="btn-primary">+ Add Book</button>
      </div>

      <div className="flex gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search books..." className="input-field max-w-md" />
        <button onClick={loadBooks} className="btn-secondary">Search</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr><th className="text-left p-4 font-medium">Title</th><th className="text-left p-4 font-medium hidden md:table-cell">Author</th><th className="text-left p-4 font-medium hidden lg:table-cell">ISBN</th><th className="text-left p-4 font-medium hidden sm:table-cell">Genre</th><th className="text-left p-4 font-medium">Copies</th><th className="text-left p-4 font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {books.filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())).map((book) => (
                  <tr key={book.id} className="border-t dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="p-4 font-medium">{book.title}</td>
                    <td className="p-4 text-gray-500 hidden md:table-cell">{book.author}</td>
                    <td className="p-4 text-gray-500 hidden lg:table-cell font-mono text-xs">{book.isbn}</td>
                    <td className="p-4 hidden sm:table-cell"><span className="badge-blue">{book.genre || '-'}</span></td>
                    <td className="p-4">
                      <span className="text-green-600 font-medium">{book.available_copies}</span>
                      <span className="text-gray-400"> / {book.total_copies}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(book)} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Edit</button>
                        <button onClick={() => handleDelete(book.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editBook ? 'Edit Book' : 'Add Book'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">ISBN *</label><input type="text" name="isbn" value={form.isbn} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" name="title" value={form.title} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm font-medium mb-1">Author *</label><input type="text" name="author" value={form.author} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm font-medium mb-1">Genre</label><input type="text" name="genre" value={form.genre} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Category</label><input type="text" name="category" value={form.category} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Publisher</label><input type="text" name="publisher" value={form.publisher} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Year</label><input type="number" name="published_year" value={form.published_year} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Pages</label><input type="number" name="pages" value={form.pages} onChange={handleChange} className="input-field" /></div>
            {!editBook && <div><label className="block text-sm font-medium mb-1">Copies</label><input type="number" name="copies" value={form.copies} onChange={handleChange} className="input-field" min="1" /></div>}
            <div><label className="block text-sm font-medium mb-1">Shelf Location</label><input type="text" name="shelf_location" value={form.shelf_location} onChange={handleChange} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea name="description" value={form.description} onChange={handleChange} className="input-field" rows="3" /></div>
          <button type="submit" className="btn-primary w-full">{editBook ? 'Update Book' : 'Add Book'}</button>
        </form>
      </Modal>
    </div>
  );
}
