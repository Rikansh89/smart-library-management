import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiMail, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <FiBook className="h-10 w-10 text-primary-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-500 mt-1">
            {sent ? 'Check your email for the reset link' : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                If an account exists with that email, you will receive a password reset link shortly.
              </p>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10" placeholder="you@example.com" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <div className="text-center">
                <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                  <FiArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
