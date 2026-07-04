const { getDatabase } = require('../config/database');

exports.getMostPopularBooks = (req, res, next) => {
  try {
    const db = getDatabase();
    const { limit = 20 } = req.query;

    const books = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM issued_books ib WHERE ib.book_id = b.id) as total_issues,
        (SELECT COUNT(DISTINCT ib.user_id) FROM issued_books ib WHERE ib.book_id = b.id) as unique_borrowers
      FROM books b
      WHERE b.is_active = 1
      ORDER BY b.borrow_count DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json({ books });
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyTrends = (req, res, next) => {
  try {
    const db = getDatabase();
    const { months = 12 } = req.query;

    const trends = db.prepare(`
      SELECT STRFTIME('%Y-%m', issue_date) as month,
        COUNT(*) as total_issues,
        SUM(CASE WHEN ib.status = 'returned' THEN 1 ELSE 0 END) as total_returns,
        COUNT(DISTINCT ib.user_id) as active_users
      FROM issued_books ib
      WHERE ib.issue_date >= DATE('now', '-' || ? || ' months')
      GROUP BY STRFTIME('%Y-%m', issue_date)
      ORDER BY month ASC
    `).all(parseInt(months));

    res.json({ trends });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryUsage = (req, res, next) => {
  try {
    const db = getDatabase();

    const categories = db.prepare(`
      SELECT b.category,
        COUNT(DISTINCT b.id) as total_books,
        COUNT(ib.id) as total_issues,
        COUNT(DISTINCT ib.user_id) as total_users,
        AVG(CASE WHEN rh.rating IS NOT NULL THEN rh.rating ELSE NULL END) as avg_rating
      FROM books b
      LEFT JOIN issued_books ib ON b.id = ib.book_id
      LEFT JOIN reading_history rh ON b.id = rh.book_id
      WHERE b.category IS NOT NULL AND b.is_active = 1
      GROUP BY b.category
      ORDER BY total_issues DESC
    `).all();

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

exports.getStudentActivity = (req, res, next) => {
  try {
    const db = getDatabase();
    const { days = 30 } = req.query;

    const students = db.prepare(`
      SELECT u.id, u.name, u.email, u.student_id, u.department,
        COUNT(DISTINCT ib.id) as total_issues,
        COUNT(DISTINCT CASE WHEN ib.status = 'returned' THEN ib.id ELSE NULL END) as total_returns,
        COUNT(DISTINCT CASE WHEN ib.status IN ('issued', 'overdue') THEN ib.id ELSE NULL END) as active_issues,
        SUM(CASE WHEN f.status = 'pending' THEN (f.amount - f.paid_amount) ELSE 0 END) as pending_fines,
        SUM(CASE WHEN f.status = 'paid' THEN f.amount ELSE 0 END) as paid_fines
      FROM users u
      LEFT JOIN issued_books ib ON u.id = ib.user_id
      LEFT JOIN fines f ON u.id = f.user_id
      WHERE u.role = 'student' AND u.is_active = 1
        AND (ib.issue_date >= DATE('now', '-' || ? || ' days') OR ib.issue_date IS NULL)
      GROUP BY u.id
      ORDER BY total_issues DESC
    `).all(parseInt(days));

    res.json({ students });
  } catch (error) {
    next(error);
  }
};

exports.getFineReports = (req, res, next) => {
  try {
    const db = getDatabase();
    const { days = 30 } = req.query;

    const fineSummary = db.prepare(`
      SELECT SUM(CASE WHEN f.status = 'paid' THEN f.amount ELSE 0 END) as collected,
        SUM(CASE WHEN f.status = 'pending' THEN (f.amount - f.paid_amount) ELSE 0 END) as outstanding,
        COUNT(CASE WHEN f.status = 'paid' THEN 1 ELSE NULL END) as paid_count,
        COUNT(CASE WHEN f.status = 'pending' THEN 1 ELSE NULL END) as pending_count,
        COUNT(CASE WHEN f.status = 'waived' THEN 1 ELSE NULL END) as waived_count
      FROM fines f
      WHERE f.created_at >= DATE('now', '-' || ? || ' days')
    `).all(parseInt(days));

    const dailyCollection = db.prepare(`
      SELECT DATE(f.paid_date) as date, SUM(f.amount) as collected
      FROM fines f
      WHERE f.status = 'paid' AND f.paid_date >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(f.paid_date)
      ORDER BY date ASC
    `).all(parseInt(days));

    const topDefaulters = db.prepare(`
      SELECT u.id, u.name, u.email, u.student_id,
        SUM(f.amount - f.paid_amount) as total_due,
        COUNT(f.id) as fine_count
      FROM fines f
      JOIN users u ON f.user_id = u.id
      WHERE f.status = 'pending'
      GROUP BY u.id
      ORDER BY total_due DESC
      LIMIT 10
    `).all();

    res.json({ summary: fineSummary[0], dailyCollection, topDefaulters });
  } catch (error) {
    next(error);
  }
};
