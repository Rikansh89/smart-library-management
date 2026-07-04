import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { resourceAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'ebook', label: 'E-Books' },
  { value: 'notes', label: 'Notes' },
  { value: 'question_paper', label: 'Question Papers' },
  { value: 'study_material', label: 'Study Materials' },
];

function DigitalLibrary() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchResources();
  }, [type, category, page]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (type) params.type = type;
      if (category) params.category = category;

      const res = await resourceAPI.getAll(params);
      const data = res.data || res;
      setResources(data.resources || []);
      setTotalPages(data.totalPages || 1);

      const cats = data.categories ||
        [...new Set((data.resources || []).map((r) => r.category).filter(Boolean))];
      if (cats.length) setCategories(cats);
    } catch {
      toast.error('Failed to load digital resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource) => {
    if (resource.file_path) {
      window.open(resource.file_path, '_blank');
    } else {
      toast.error('Download not available');
    }
  };

  const getTypeBadge = (type) => {
    const styles = {
      ebook: 'bg-blue-100 text-blue-600',
      notes: 'bg-green-100 text-green-600',
      question_paper: 'bg-purple-100 text-purple-600',
      study_material: 'bg-orange-100 text-orange-600',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[type] || 'bg-gray-100 text-gray-600'
        }`}
      >
        {type?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="transition-page p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Digital Library
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="input-field sm:w-48"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
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
      ) : resources.length === 0 ? (
        <div className="text-center py-16">
          <FiFileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">No resources found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <div key={resource.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {resource.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {resource.category || 'General'}
                    </p>
                  </div>
                  {getTypeBadge(resource.type)}
                </div>
                {resource.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                )}
                <button
                  onClick={() => handleDownload(resource)}
                  className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                >
                  <FiDownload size={16} /> Download
                </button>
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

export default DigitalLibrary;
