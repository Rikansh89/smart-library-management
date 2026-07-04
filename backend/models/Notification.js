const pool = require('../config/db');

const Notification = {
  async create({ user_id, title, message, type }) {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [user_id, title, message, type]
    );
    return result.insertId;
  },

  async findByUser(user_id, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?', [user_id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [user_id, String(limit), String(offset)]
    );
    return { notifications: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async markAsRead(id) {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
  },

  async markAllAsRead(user_id) {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [user_id]);
  },

  async getUnreadCount(user_id) {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [user_id]
    );
    return count;
  }
};

module.exports = Notification;
