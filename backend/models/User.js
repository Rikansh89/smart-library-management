const pool = require('../config/db');

const User = {
  async create({ name, email, password, role = 'student' }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async findAll(role = null, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, name, email, role, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      countQuery += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(countQuery, role ? [role] : []);

    return { users: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => fields[k]);
    await pool.query(`UPDATE users SET ${sets} WHERE id = ?`, [...values, id]);
  },

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  },

  async updatePassword(email, hashedPassword) {
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
  }
};

module.exports = User;
