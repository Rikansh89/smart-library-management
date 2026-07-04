const pool = require('../config/db');

const StudyRoom = {
  async create({ name, capacity, location, description }) {
    const [result] = await pool.query(
      'INSERT INTO study_rooms (name, capacity, location, description) VALUES (?, ?, ?, ?)',
      [name, capacity, location, description]
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await pool.query(
      `SELECT sr.*,
        (SELECT COUNT(*) FROM room_bookings rb WHERE rb.room_id = sr.id AND rb.date = CURDATE() AND rb.status = 'active') as today_bookings
       FROM study_rooms sr ORDER BY sr.name`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM study_rooms WHERE id = ?', [id]);
    return rows[0];
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => fields[k]);
    await pool.query(`UPDATE study_rooms SET ${sets} WHERE id = ?`, [...values, id]);
  },

  async delete(id) {
    await pool.query('DELETE FROM study_rooms WHERE id = ?', [id]);
  },

  async getAvailability(room_id, date) {
    const [bookings] = await pool.query(
      `SELECT time_slot FROM room_bookings 
       WHERE room_id = ? AND date = ? AND status = 'active'`,
      [room_id, date]
    );
    const bookedSlots = bookings.map(b => b.time_slot);
    const allSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
                      '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'];
    return allSlots.map(slot => ({
      time_slot: slot,
      available: !bookedSlots.includes(slot)
    }));
  }
};

module.exports = StudyRoom;
