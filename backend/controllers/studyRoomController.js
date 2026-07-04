const StudyRoom = require('../models/StudyRoom');
const RoomBooking = require('../models/RoomBooking');

exports.createRoom = async (req, res, next) => {
  try {
    const { name, capacity, location, description } = req.body;
    if (!name || !capacity) {
      return res.status(400).json({ message: 'Name and capacity are required.' });
    }
    const roomId = await StudyRoom.create({ name, capacity, location, description });
    res.status(201).json({ message: 'Study room created.', roomId });
  } catch (error) {
    next(error);
  }
};

exports.getAllRooms = async (req, res, next) => {
  try {
    const rooms = await StudyRoom.findAll();
    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

exports.getRoomAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const room = await StudyRoom.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }
    const availability = await StudyRoom.getAvailability(id, date || new Date().toISOString().split('T')[0]);
    res.json({ room, availability });
  } catch (error) {
    next(error);
  }
};

exports.bookRoom = async (req, res, next) => {
  try {
    const { room_id, date, time_slot } = req.body;
    const user_id = req.user.id;

    if (!room_id || !date || !time_slot) {
      return res.status(400).json({ message: 'Room, date, and time slot are required.' });
    }

    const isBooked = await RoomBooking.isSlotBooked(room_id, date, time_slot);
    if (isBooked) {
      return res.status(409).json({ message: 'Time slot already booked.' });
    }

    const bookingId = await RoomBooking.create({ user_id, room_id, date, time_slot });
    res.status(201).json({ message: 'Room booked successfully.', bookingId });
  } catch (error) {
    next(error);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await RoomBooking.findByUser(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await RoomBooking.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await RoomBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    await RoomBooking.updateStatus(id, 'cancelled');
    res.json({ message: 'Booking cancelled.' });
  } catch (error) {
    next(error);
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await StudyRoom.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }
    const { name, capacity, location, description } = req.body;
    const fields = {};
    if (name) fields.name = name;
    if (capacity) fields.capacity = capacity;
    if (location) fields.location = location;
    if (description) fields.description = description;
    await StudyRoom.update(id, fields);
    res.json({ message: 'Room updated.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await StudyRoom.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }
    await StudyRoom.delete(id);
    res.json({ message: 'Room deleted.' });
  } catch (error) {
    next(error);
  }
};
