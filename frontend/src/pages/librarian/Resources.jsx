import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiFile, FiPlus } from 'react-icons/fi';
import { resourceAPI } from '../../services/api';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RESOURCE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'ebook', label: 'E-Book' },
  { value: 'notes', label: 'Notes' },
  { value: 'question_paper', label: 'Question Paper' },
  { value: 'study_material', label: 'Study Material' },
];

const initialForm = {
  title: '',
  description: '',
  type: '',
  category: '',
};

const Resources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, categoryFilter]);

  useEffect(() => {
    fetchResources();
  }, [page, typeFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await resourceAPI.getCategories();
      setCategories(res.data?.categories || res.data?.data || []);
    } catch {
      // ignore
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await resourceAPI.getAll(params);
      const data = res.data;
      setResources(data?.resources || data?.data || []);
      setTotalPages(data?.totalPages || Math.ceil((data?.total || 0) / 10) || 1);
    } catch (error) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => {
    setForm(initialForm);
    setFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);

      await resourceAPI.upload(formData);
      toast.success('Resource uploaded successfully');
      setModalOpen(false);
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await resourceAPI.delete(id);
      toast.success('Resource deleted successfully');
      setDeleteConfirm(null);
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete resource');
    }
  };

  const getTypeIcon = (type) => {
    return FiFile;
  };

  const getTypeBadge = (type) => {
    const styles = {
      ebook: 'bg-purple-100 text-purple-700',
      notes: 'bg-blue-100 text-blue-700',
      question_paper: 'bg-orange-100 text-orange-700',
      study_material: 'bg-green-100 text-green-700',
    };
    return `inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Digital Resources</h1>
        <button onClick={openUploadModal} className="btn-primary flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <FiUpload className="w-4 h-4" />
          Upload Resource
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field border border-gray-300 rounded-lg px-3 py-2"
        >
          {RESOURCE_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
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
      ) : resources.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No resources found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">File</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => (
                  <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800 font-medium">{res.title}</td>
                    <td className="py-3 px-4">
                      <span className={getTypeBadge(res.type)}>{res.type?.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{res.category || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{res.description || '-'}</td>
                    <td className="py-3 px-4">
                      {res.file_url ? (
                        <a
                          href={res.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <FiFile className="w-4 h-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setDeleteConfirm(res)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Resource">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required className="input-field w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select type</option>
              {RESOURCE_TYPES.filter((t) => t.value).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} required className="w-full" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Uploading...' : 'Upload'}
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

export default Resources;
