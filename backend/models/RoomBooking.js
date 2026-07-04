const pool = require('../config/db');

const RoomBooking = {
  async create({ user_id, room_id, date, time_slot }) {
    const [result] = await pool.query(
      'INSERT INTO room_bookings (user_id, room_id, date, time_slot) VALUES (?, ?, ?, ?)',
      [user_id, room_id, date, time_slot]
    );
    return result.insertId;
  },

  async findByUser(user_id, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM room_bookings WHERE user_id = ?', [user_id]
    );
    const [rows] = await pool.query(
      `SELECT rb.*, sr.name as room_name, sr.capacity, sr.location
       FROM room_bookings rb
       JOIN study_rooms sr ON rb.room_id = sr.id
       WHERE rb.user_id = ?
       ORDER BY rb.created_at DESC
       LIMIT ? OFFSET ?`,
      [user_id, String(limit), String(offset)]
    );
    return { bookings: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getAll({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM room_bookings');
    const [rows] = await pool.query(
      `SELECT rb.*, sr.name as room_name, u.name as user_name, u.email as user_email
       FROM room_bookings rb
       JOIN study_rooms sr ON rb.room_id = sr.id
       JOIN users u ON rb.user_id = u.id
       ORDER BY rb.created_at DESC
       LIMIT ? OFFSET ?`,
      [String(limit), String(offset)]
    );
    return { bookings: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT rb.*, sr.name as room_name, u.name as user_name
       FROM room_bookings rb
       JOIN study_rooms sr ON rb.room_id = sr.id
       JOIN users u ON rb.user_id = u.id
       WHERE rb.id = ?`, [id]
    );
    return rows[0];
  },

  async isSlotBooked(room_id, date, time_slot) {
    const [rows] = await pool.query(
      "SELECT * FROM room_bookings WHERE room_id = ? AND date = ? AND time_slot = ? AND status = 'active'",
      [room_id, date, time_slot]
    );
    return rows.length > 0;
  },

  async updateStatus(id, status) {
    await pool.query('UPDATE room_bookings SET status = ? WHERE id = ?', [status, id]);
  }
};

module.exports = RoomBooking;
