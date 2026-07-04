import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
        <FiChevronLeft className="h-4 w-4" />
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded-lg hover:bg-gray-100 text-sm">1</button>
          {pages[0] > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            p === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700'
          }`}>
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <button onClick={() => onPageChange(totalPages)}
            className="px-3 py-1 rounded-lg hover:bg-gray-100 text-sm">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
        <FiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
