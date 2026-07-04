import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Password reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</h1>
          <p className="text-gray-500 dark:text-dark-400 mt-2">Reset your password</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-dark-700">
          {sent ? (
            <div className="text-center">
              <div className="text-green-500 text-4xl mb-3">✓</div>
              <p className="text-gray-700 dark:text-dark-200">Reset link sent to <strong>{email}</strong></p>
              <p className="text-sm text-gray-500 mt-2">Check your email for instructions.</p>
              <Link to="/login" className="btn-primary inline-block mt-6">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-dark-400">Enter your email address and we'll send you a reset link.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Back to Login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
