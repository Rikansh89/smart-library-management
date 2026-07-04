import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'student', label: 'Students' },
  { key: 'librarian', label: 'Librarians' },
];

const initialForm = { name: '', email: '', password: '', role: 'student' };

export default function ManageUsers() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, activeTab]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, limit: 10 };
      if (activeTab !== 'all') params.role = activeTab;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data?.users ?? res.data?.data ?? []);
      setTotalPages(res.data?.totalPages ?? res.data?.pagination?.totalPages ?? 1);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load users';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setFormData(initialForm);
    setShowAddModal(true);
  }

  function openEdit(u) {
    setSelectedUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, password: '' });
    setShowEditModal(true);
  }

  function openDelete(u) {
    setSelectedUser(u);
    setShowDeleteModal(true);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    setSubmitting(true);
    try {
      await adminAPI.createUser(formData);
      toast.success('User created successfully');
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: formData.name, email: formData.email, role: formData.role };
      if (formData.password) payload.password = formData.password;
      await adminAPI.updateUser(selectedUser._id || selectedUser.id, payload);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await adminAPI.deleteUser(selectedUser._id || selectedUser.id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      if (users.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && users.length === 0) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add User
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="text-sm underline">Retry</button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-600">Name</th>
              <th className="text-left p-3 font-medium text-gray-600">Email</th>
              <th className="text-left p-3 font-medium text-gray-600">Role</th>
              <th className="text-left p-3 font-medium text-gray-600">Created Date</th>
              <th className="text-right p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">No users found.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u._id || u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-gray-600">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'librarian' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <FiEdit2 size={16} />
                      </button>
                      {authUser?.email !== u.email && (
                        <button onClick={() => openDelete(u)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add User">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input className="input-field w-full" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field w-full" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="input-field w-full" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input-field w-full" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}>
              <option value="student">Student</option>
              <option value="librarian">Librarian</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add User'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input className="input-field w-full" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field w-full" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep)</label>
            <input type="password" className="input-field w-full" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input-field w-full" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}>
              <option value="student">Student</option>
              <option value="librarian">Librarian</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Delete">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete user <strong>{selectedUser?.name}</strong> ({selectedUser?.email})? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={submitting} className="btn-danger">{submitting ? 'Deleting...' : 'Delete User'}</button>
        </div>
      </Modal>
    </div>
  );
}
