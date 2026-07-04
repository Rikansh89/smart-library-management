const pool = require('../config/db');

const IssuedBook = {
  async create({ user_id, book_id, due_date, issued_by }) {
    const [result] = await pool.query(
      `INSERT INTO issued_books (user_id, book_id, due_date, issued_by) VALUES (?, ?, ?, ?)`,
      [user_id, book_id, due_date, issued_by]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ib.*, b.title as book_title, b.author, b.isbn, b.cover_image,
              u.name as user_name, u.email as user_email
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.id
       JOIN users u ON ib.user_id = u.id
       WHERE ib.id = ?`, [id]
    );
    return rows[0];
  },

  async findByUser(user_id, { status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE ib.user_id = ?';
    let params = [user_id];

    if (status) {
      where += ' AND ib.status = ?';
      params.push(status);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM issued_books ib ${where}`, params
    );

    const [rows] = await pool.query(
      `SELECT ib.*, b.title as book_title, b.author, b.isbn, b.cover_image,
              DATEDIFF(CURDATE(), ib.due_date) as overdue_days
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.id
       ${where}
       ORDER BY ib.issue_date DESC
       LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    return { issues: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getAll({ status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let where = '';
    let params = [];

    if (status) {
      where = 'WHERE ib.status = ?';
      params.push(status);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM issued_books ib ${where}`, params
    );

    const [rows] = await pool.query(
      `SELECT ib.*, b.title as book_title, b.author, b.isbn, b.cover_image,
              u.name as user_name, u.email as user_email
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.id
       JOIN users u ON ib.user_id = u.id
       ${where}
       ORDER BY ib.issue_date DESC
       LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    return { issues: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async updateStatus(id, status, returned_by = null) {
    const fields = { status };
    if (status === 'returned') {
      fields.return_date = new Date();
      if (returned_by) fields.returned_to = returned_by;
    }
    if (status === 'approved') {
      fields.approved_date = new Date();
    }
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    await pool.query(`UPDATE issued_books SET ${sets} WHERE id = ?`, [...values, id]);
  },

  async getActiveLoansCount(user_id) {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM issued_books WHERE user_id = ? AND status = "issued"',
      [user_id]
    );
    return count;
  },

  async getOverdueLoans() {
    const [rows] = await pool.query(
      `SELECT ib.*, b.title as book_title, u.name as user_name, u.email as user_email,
              DATEDIFF(CURDATE(), ib.due_date) as overdue_days
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.id
       JOIN users u ON ib.user_id = u.id
       WHERE ib.status = 'issued' AND ib.due_date < CURDATE()`
    );
    return rows;
  },

  async getStats() {
    const [[{ total_issued }]] = await pool.query(
      "SELECT COUNT(*) as total_issued FROM issued_books WHERE status = 'issued'"
    );
    const [[{ total_returned }]] = await pool.query(
      "SELECT COUNT(*) as total_returned FROM issued_books WHERE status = 'returned'"
    );
    return { total_issued, total_returned };
  }
};

module.exports = IssuedBook;
