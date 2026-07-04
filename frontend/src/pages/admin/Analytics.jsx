import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { analyticsAPI, fineAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [fineStats, setFineStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, finesRes] = await Promise.all([
        analyticsAPI.getFull(),
        fineAPI.getStats(),
      ]);
      setAnalytics(analyticsRes.data);
      setFineStats(finesRes.data);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load analytics';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const categoryData = {
    labels: (analytics?.categoryPopularity || []).map(c => c.category) || [],
    datasets: [
      {
        label: 'Books',
        data: (analytics?.categoryPopularity || []).map(c => c.borrow_count || c.count) || [],
        backgroundColor: [
          'rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)',
          'rgba(239,68,68,0.7)', 'rgba(139,92,246,0.7)', 'rgba(236,72,153,0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const categoryOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Category Popularity', font: { size: 16 } },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const monthlyData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Borrows',
        data: monthLabels.map((_, i) => analytics?.monthlyTrends?.[i]?.count ?? 0),
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Returns',
        data: monthLabels.map((_, i) => analytics?.monthlyTrends?.[i]?.returns ?? 0),
        borderColor: 'rgba(16,185,129,1)',
        backgroundColor: 'rgba(16,185,129,0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const monthlyOptions = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Monthly Borrowing Trends', font: { size: 16 } },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const paid = fineStats?.paid ?? 0;
  const unpaid = fineStats?.unpaid ?? 0;
  const fineData = {
    labels: ['Paid', 'Unpaid'],
    datasets: [
      {
        data: [paid, unpaid],
        backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(239,68,68,0.8)'],
        borderWidth: 0,
      },
    ],
  };

  const fineOptions = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Fine Collection Stats', font: { size: 16 } },
      legend: { position: 'bottom' },
    },
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchAnalytics} className="btn-primary">Retry</button>
      </div>
    );
  }

  const mostBorrowed = analytics?.mostBorrowed || [];
  const activeStudents = analytics?.activeStudents || [];
  const hasBooks = mostBorrowed.length > 0;
  const hasStudents = activeStudents.length > 0;
  const hasCategories = (analytics?.categoryPopularity?.length ?? 0) > 0;
  const hasMonthly = (analytics?.monthlyTrends?.length ?? 0) > 0;
  const hasFineData = paid > 0 || unpaid > 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Most Borrowed Books</h2>
          {!hasBooks ? (
            <p className="text-gray-400 text-center py-8">No records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-2 font-medium text-gray-500">#</th>
                    <th className="pb-2 font-medium text-gray-500">Title</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Times Borrowed</th>
                  </tr>
                </thead>
                <tbody>
                  {mostBorrowed.map((b, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2">{b.title || b.name}</td>
                      <td className="py-2 text-right font-medium">{b.borrow_count || b.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Most Active Students</h2>
          {!hasStudents ? (
            <p className="text-gray-400 text-center py-8">No records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-2 font-medium text-gray-500">#</th>
                    <th className="pb-2 font-medium text-gray-500">Name</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Books Borrowed</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudents.map((s, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2">{s.name}</td>
                      <td className="py-2 text-right font-medium">{s.borrow_count || s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          {hasCategories ? (
            <Bar data={categoryData} options={categoryOptions} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No category data available yet.</p>
            </div>
          )}
        </div>

        <div className="card p-4">
          {hasMonthly ? (
            <Line data={monthlyData} options={monthlyOptions} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No monthly trends data available yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4 flex items-center justify-center">
          {hasFineData ? (
            <div className="w-full max-w-sm">
              <Doughnut data={fineData} options={fineOptions} />
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Paid: {paid}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Unpaid: {unpaid}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No fine data available yet.</p>
            </div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Total Fines</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-700 font-medium">Collected Fines</span>
              <span className="text-xl font-bold text-green-600">${(fineStats?.collected ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-700 font-medium">Pending Fines</span>
              <span className="text-xl font-bold text-yellow-600">${(fineStats?.pending ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700 font-medium">Total Fines</span>
              <span className="text-xl font-bold text-blue-600">${((fineStats?.collected ?? 0) + (fineStats?.pending ?? 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
