const pool = require('../config/db');

const Recommendation = {
  async getByCategory(user_id, limit = 5) {
    const [categories] = await pool.query(
      `SELECT b.category, COUNT(*) as cnt
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.id
       WHERE ib.user_id = ?
       GROUP BY b.category
       ORDER BY cnt DESC
       LIMIT 3`, [user_id]
    );

    if (categories.length === 0) return [];

    const categoryList = categories.map(c => c.category);
    const placeholders = categoryList.map(() => '?').join(',');

    const [books] = await pool.query(
      `SELECT DISTINCT b.* FROM books b
       WHERE b.category IN (${placeholders})
       AND b.id NOT IN (SELECT book_id FROM issued_books WHERE user_id = ?)
       AND b.available_quantity > 0
       ORDER BY b.borrow_count DESC
       LIMIT ?`,
      [...categoryList, user_id, String(limit)]
    );
    return books;
  },

  async getPopular(limit = 5) {
    const [books] = await pool.query(
      `SELECT * FROM books ORDER BY borrow_count DESC LIMIT ?`, [String(limit)]
    );
    return books;
  },

  async getByAuthor(user_id, limit = 5) {
    const [authors] = await pool.query(
      `SELECT b.author, COUNT(*) as cnt
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.id
       WHERE ib.user_id = ?
       GROUP BY b.author
       ORDER BY cnt DESC
       LIMIT 3`, [user_id]
    );

    if (authors.length === 0) return [];

    const authorList = authors.map(a => a.author);
    const placeholders = authorList.map(() => '?').join(',');

    const [books] = await pool.query(
      `SELECT DISTINCT b.* FROM books b
       WHERE b.author IN (${placeholders})
       AND b.id NOT IN (SELECT book_id FROM issued_books WHERE user_id = ?)
       AND b.available_quantity > 0
       ORDER BY b.borrow_count DESC
       LIMIT ?`,
      [...authorList, user_id, String(limit)]
    );
    return books;
  },

  async logInteraction(user_id, book_id, interaction_type) {
    await pool.query(
      'INSERT INTO recommendations (user_id, book_id, interaction_type) VALUES (?, ?, ?)',
      [user_id, book_id, interaction_type]
    );
  }
};

module.exports = Recommendation;
