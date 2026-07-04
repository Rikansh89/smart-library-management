import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student', department: '', student_id: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        name: form.name, email: form.email, password: form.password,
        role: form.role, department: form.department, student_id: form.student_id
      });
      toast.success(`Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 dark:text-dark-400 mt-2">Join LibraMind AI</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-dark-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="john@example.com" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field" placeholder="Min 6 chars" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Confirm</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="input-field" placeholder="Repeat password" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="select-field">
                <option value="student">Student</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>
            {form.role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Student ID</label>
                  <input type="text" name="student_id" value={form.student_id} onChange={handleChange} className="input-field" placeholder="STU001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Department</label>
                  <input type="text" name="department" value={form.department} onChange={handleChange} className="input-field" placeholder="CS" />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-dark-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
