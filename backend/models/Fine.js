const pool = require('../config/db');

const Fine = {
  async create({ user_id, issued_book_id, amount, reason }) {
    const [result] = await pool.query(
      'INSERT INTO fines (user_id, issued_book_id, amount, reason) VALUES (?, ?, ?, ?)',
      [user_id, issued_book_id, amount, reason]
    );
    return result.insertId;
  },

  async findByUser(user_id, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM fines WHERE user_id = ?', [user_id]
    );
    const [rows] = await pool.query(
      `SELECT f.*, b.title as book_title
       FROM fines f
       JOIN issued_books ib ON f.issued_book_id = ib.id
       JOIN books b ON ib.book_id = b.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [user_id, String(limit), String(offset)]
    );
    return { fines: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async payFine(id) {
    await pool.query('UPDATE fines SET status = "paid", paid_at = NOW() WHERE id = ?', [id]);
  },

  async getTotalUnpaid(user_id) {
    const [[{ total }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE user_id = ? AND status = "unpaid"',
      [user_id]
    );
    return total;
  },

  async getStats() {
    const [[{ total_collected }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_collected FROM fines WHERE status = "paid"'
    );
    const [[{ total_pending }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_pending FROM fines WHERE status = "unpaid"'
    );
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM fines WHERE status = "unpaid"');
    return { total_collected, total_pending, unpaid_count: count };
  }
};

module.exports = Fine;
