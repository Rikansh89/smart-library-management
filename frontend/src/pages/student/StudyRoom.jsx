import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiUsers, FiMapPin, FiCalendar, FiX } from 'react-icons/fi';
import { roomAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TIME_SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00',
  '15:00-16:00', '16:00-17:00', '17:00-18:00',
];

function StudyRoom() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [availability, setAvailability] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [view, setView] = useState('rooms');
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll();
      const data = res.data || res;
      setRooms(Array.isArray(data) ? data : data.rooms || []);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (roomId, date) => {
    setLoadingAvail(true);
    setSelectedSlot(null);
    try {
      const res = await roomAPI.getAvailability(roomId, date);
      const data = res.data || res;
      setAvailability(data.availability || data || []);
    } catch {
      toast.error('Failed to load availability');
    } finally {
      setLoadingAvail(false);
    }
  };

  const fetchMyBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await roomAPI.getMyBookings({ limit: 20 });
      const data = res.data || res;
      setMyBookings(data.bookings || []);
    } catch {
      toast.error('Failed to load your bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    fetchAvailability(room.id, selectedDate);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (selectedRoom) {
      fetchAvailability(selectedRoom.id, date);
    }
  };

  const handleBook = async () => {
    if (!selectedRoom || !selectedDate || !selectedSlot) {
      toast.error('Please select a room, date, and time slot');
      return;
    }
    setBooking(true);
    try {
      await roomAPI.book({
        room_id: selectedRoom.id,
        date: selectedDate,
        time_slot: selectedSlot,
      });
      toast.success('Room booked successfully!');
      setSelectedSlot(null);
      fetchAvailability(selectedRoom.id, selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book room');
    } finally {
      setBooking(false);
    }
  };

  const handleCancelBooking = async (id) => {
    setCancelling(id);
    try {
      await roomAPI.cancelBooking(id);
      toast.success('Booking cancelled');
      fetchMyBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const toggleView = (newView) => {
    setView(newView);
    if (newView === 'my-bookings') {
      fetchMyBookings();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="transition-page p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Study Rooms</h1>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => toggleView('rooms')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'rooms'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Rooms
          </button>
          <button
            onClick={() => toggleView('my-bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'my-bookings'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            My Bookings
          </button>
        </div>
      </div>

      {view === 'rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                className={`card p-4 w-full text-left transition-all ${
                  selectedRoom?.id === room.id
                    ? 'ring-2 ring-indigo-500'
                    : ''
                }`}
              >
                <h3 className="font-semibold text-gray-800">{room.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiUsers size={14} /> {room.capacity}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMapPin size={14} /> {room.location || 'N/A'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedRoom ? (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {selectedRoom.name} - Availability
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="input-field"
                  />
                </div>

                {loadingAvail ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {TIME_SLOTS.map((slot) => {
                        const avail = availability.find(
                          (a) => a.time_slot === slot
                        );
                        const isBooked = avail ? !avail.available : true;
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => {
                              if (!isBooked) setSelectedSlot(slot);
                            }}
                            disabled={isBooked}
                            className={`p-3 rounded-lg text-sm font-medium border transition-all ${
                              isBooked
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : isSelected
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>

                    {selectedSlot && (
                      <button
                        onClick={handleBook}
                        disabled={booking}
                        className="btn-primary disabled:opacity-50"
                      >
                        {booking
                          ? 'Booking...'
                          : `Book ${selectedSlot} on ${selectedDate}`}
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="card p-6 text-center text-gray-400">
                <FiCalendar size={48} className="mx-auto mb-4" />
                <p>Select a room to view availability</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'my-bookings' && (
        <>
          {loadingBookings ? (
            <LoadingSpinner />
          ) : myBookings.length === 0 ? (
            <div className="text-center py-16">
              <FiCalendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400 text-lg">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {booking.room_name || 'Room'}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-400">
                      <span>
                        Date:{' '}
                        {new Date(booking.date).toLocaleDateString()}
                      </span>
                      <span>Time: {booking.time_slot}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancelling === booking.id}
                    className="btn-danger text-sm disabled:opacity-50"
                  >
                    {cancelling === booking.id ? '...' : 'Cancel'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StudyRoom;
