import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import BarChart from '../../components/Charts/BarChart';
import LineChart from '../../components/Charts/LineChart';
import PieChart from '../../components/Charts/PieChart';

export default function Analytics() {
  const [popular, setPopular] = useState([]);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getPopularBooks({ limit: 10 }),
      analyticsAPI.getMonthlyTrends({ months: 12 }),
      analyticsAPI.getCategoryUsage()
    ]).then(([p, t, c]) => {
      setPopular(p.data.books);
      setTrends(t.data.trends);
      setCategories(c.data.categories);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  const trendChart = trends.length ? {
    labels: trends.map(t => t.month),
    datasets: [
      { label: 'Issues', data: trends.map(t => t.total_issues), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
      { label: 'Returns', data: trends.map(t => t.total_returns), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 },
      { label: 'Active Users', data: trends.map(t => t.active_users), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4 },
    ]
  } : null;

  const categoryChart = categories.length ? {
    labels: categories.map(c => c.category),
    datasets: [{
      data: categories.map(c => c.total_issues),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'],
    }]
  } : null;

  const popularChart = popular.length ? {
    labels: popular.slice(0, 10).map(b => b.title.length > 20 ? b.title.slice(0, 20) + '...' : b.title),
    datasets: [{
      label: 'Times Borrowed',
      data: popular.slice(0, 10).map(b => b.borrow_count),
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }]
  } : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trendChart && (
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Monthly Borrowing Trends</h2>
            <LineChart data={trendChart} height={300} />
          </div>
        )}

        {popularChart && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Most Popular Books</h2>
            <BarChart data={popularChart} height={300} />
          </div>
        )}

        {categoryChart && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Category-wise Usage</h2>
            <PieChart data={categoryChart} height={300} />
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Category Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b dark:border-dark-700"><th className="pb-3 font-medium">Category</th><th className="pb-3 font-medium">Books</th><th className="pb-3 font-medium">Issues</th><th className="pb-3 font-medium">Users</th><th className="pb-3 font-medium">Avg Rating</th></tr></thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={i} className="border-b dark:border-dark-700 last:border-0">
                  <td className="py-3 font-medium">{c.category}</td>
                  <td className="py-3">{c.total_books}</td>
                  <td className="py-3">{c.total_issues}</td>
                  <td className="py-3">{c.total_users}</td>
                  <td className="py-3">{c.avg_rating ? Number(c.avg_rating).toFixed(1) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
