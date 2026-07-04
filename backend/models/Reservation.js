const pool = require('../config/db');

const Reservation = {
  async create({ user_id, book_id }) {
    const [result] = await pool.query(
      'INSERT INTO reservations (user_id, book_id) VALUES (?, ?)',
      [user_id, book_id]
    );
    return result.insertId;
  },

  async findByUser(user_id, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM reservations WHERE user_id = ?', [user_id]
    );
    const [rows] = await pool.query(
      `SELECT r.*, b.title as book_title, b.author, b.isbn, b.cover_image
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [user_id, String(limit), String(offset)]
    );
    return { reservations: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getAll({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM reservations');
    const [rows] = await pool.query(
      `SELECT r.*, b.title as book_title, b.author, b.isbn, b.cover_image,
              u.name as user_name, u.email as user_email
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [String(limit), String(offset)]
    );
    return { reservations: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*, b.title as book_title, b.author, u.name as user_name, u.email as user_email
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`, [id]
    );
    return rows[0];
  },

  async updateStatus(id, status) {
    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
  },

  async hasActiveReservation(user_id, book_id) {
    const [rows] = await pool.query(
      "SELECT * FROM reservations WHERE user_id = ? AND book_id = ? AND status = 'active'",
      [user_id, book_id]
    );
    return rows.length > 0;
  },

  async getNextInLine(book_id) {
    const [rows] = await pool.query(
      "SELECT * FROM reservations WHERE book_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1",
      [book_id]
    );
    return rows[0];
  }
};

module.exports = Reservation;
