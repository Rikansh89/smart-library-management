import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCalendar } from 'react-icons/fi';
import { roomAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const initialForm = {
  name: '',
  capacity: '',
  location: '',
  description: '',
};

const ManageRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);

  useEffect(() => {
    if (activeTab === 'rooms') {
      fetchRooms();
    } else {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data?.rooms || res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await roomAPI.getAllBookings({});
      setBookings(res.data?.bookings || res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setForm({
      name: room.name || '',
      capacity: room.capacity || '',
      location: room.location || '',
      description: room.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        capacity: parseInt(form.capacity) || 0,
      };

      if (editingRoom) {
        await roomAPI.update(editingRoom.id, payload);
        toast.success('Room updated successfully');
      } else {
        await roomAPI.create(payload);
        toast.success('Room added successfully');
      }
      setModalOpen(false);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await roomAPI.delete(id);
      toast.success('Room deleted successfully');
      setDeleteConfirm(null);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await roomAPI.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      setCancelConfirm(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Rooms</h1>
        {activeTab === 'rooms' && (
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <FiPlus className="w-4 h-4" />
            Add Room
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'rooms'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Rooms
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'bookings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiCalendar className="w-4 h-4" />
          Bookings
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : activeTab === 'rooms' ? (
        rooms.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No rooms found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{room.name}</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(room)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(room)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Capacity:</span> {room.capacity} people</p>
                  <p><span className="font-medium">Location:</span> {room.location || 'N/A'}</p>
                  {room.description && (
                    <p className="text-gray-500 line-clamp-2">{room.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{booking.room_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-800">{booking.user_name || booking.user_email || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {booking.date ? new Date(booking.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {booking.time_slot || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'active' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => setCancelConfirm(booking)}
                            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingRoom ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-field w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : editingRoom ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </Modal>

      <Modal isOpen={!!cancelConfirm} onClose={() => setCancelConfirm(null)} title="Cancel Booking">
        <p className="text-gray-600 mb-6">
          Are you sure you want to cancel this booking for <strong>{cancelConfirm?.room?.name}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setCancelConfirm(null)} className="btn-secondary px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => handleCancelBooking(cancelConfirm.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Cancel Booking</button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageRooms;
