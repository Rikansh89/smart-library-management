const pool = require('../config/db');

const Resource = {
  async create({ title, description, type, category, file_path, file_size, uploaded_by }) {
    const [result] = await pool.query(
      'INSERT INTO resources (title, description, type, category, file_path, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, type, category, file_path, file_size, uploaded_by]
    );
    return result.insertId;
  },

  async findAll({ type, category, page = 1, limit = 12 }) {
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];

    if (type) {
      where.push('type = ?');
      params.push(type);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM resources ${whereClause}`, params);

    const [rows] = await pool.query(
      `SELECT r.*, u.name as uploaded_by_name
       FROM resources r
       LEFT JOIN users u ON r.uploaded_by = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    return { resources: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*, u.name as uploaded_by_name
       FROM resources r
       LEFT JOIN users u ON r.uploaded_by = u.id
       WHERE r.id = ?`, [id]
    );
    return rows[0];
  },

  async delete(id) {
    const [rows] = await pool.query('SELECT file_path FROM resources WHERE id = ?', [id]);
    await pool.query('DELETE FROM resources WHERE id = ?', [id]);
    return rows[0];
  },

  async getCategories() {
    const [rows] = await pool.query('SELECT DISTINCT category FROM resources WHERE category IS NOT NULL ORDER BY category');
    return rows.map(r => r.category);
  }
};

module.exports = Resource;
