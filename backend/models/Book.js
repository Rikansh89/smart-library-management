const pool = require('../config/db');

const Book = {
  async create({ title, author, isbn, category, publication_year, quantity, description, cover_image }) {
    const [result] = await pool.query(
      `INSERT INTO books (title, author, isbn, category, publication_year, quantity, available_quantity, description, cover_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, isbn, category, publication_year, quantity, quantity, description, cover_image || null]
    );
    return result.insertId;
  },

  async findAll({ page = 1, limit = 12, search, category, sort } = {}) {
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];

    if (search) {
      where.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      where.push('b.category = ?');
      params.push(category);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    let orderBy = 'ORDER BY b.created_at DESC';
    if (sort === 'title') orderBy = 'ORDER BY b.title ASC';
    if (sort === 'popular') orderBy = 'ORDER BY b.borrow_count DESC';

    const countQuery = `SELECT COUNT(*) as total FROM books b ${whereClause}`;
    const [[{ total }]] = await pool.query(countQuery, params);

    const query = `SELECT b.*, 
      (SELECT COUNT(*) FROM issued_books ib WHERE ib.book_id = b.id AND ib.status = 'issued') as active_loans
      FROM books b ${whereClause} ${orderBy} LIMIT ? OFFSET ?`;
    params.push(String(limit), String(offset));

    const [rows] = await pool.query(query, params);
    return { books: rows, total, page, totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT b.*,
        (SELECT COUNT(*) FROM issued_books ib WHERE ib.book_id = b.id AND ib.status = 'issued') as active_loans
       FROM books b WHERE b.id = ?`, [id]
    );
    return rows[0];
  },

  async findByISBN(isbn) {
    const [rows] = await pool.query('SELECT * FROM books WHERE isbn = ?', [isbn]);
    return rows[0];
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => fields[k]);
    await pool.query(`UPDATE books SET ${sets} WHERE id = ?`, [...values, id]);
  },

  async delete(id) {
    await pool.query('DELETE FROM books WHERE id = ?', [id]);
  },

  async getCategories() {
    const [rows] = await pool.query('SELECT DISTINCT category FROM books ORDER BY category');
    return rows.map(r => r.category);
  },

  async getMostBorrowed(limit = 10) {
    const [rows] = await pool.query(
      `SELECT b.*, COUNT(ib.id) as borrow_count
       FROM books b
       JOIN issued_books ib ON b.id = ib.book_id
       GROUP BY b.id
       ORDER BY borrow_count DESC
       LIMIT ?`, [String(limit)]
    );
    return rows;
  },

  async incrementBorrowCount(id) {
    await pool.query('UPDATE books SET borrow_count = borrow_count + 1 WHERE id = ?', [id]);
  }
};

module.exports = Book;
