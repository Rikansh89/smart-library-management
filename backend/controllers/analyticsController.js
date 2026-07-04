const pool = require('../config/db');

exports.getAnalytics = async (req, res, next) => {
  try {
    const [mostBorrowed] = await pool.query(
      `SELECT b.id, b.title, b.author, b.isbn, COUNT(ib.id) as borrow_count
       FROM books b JOIN issued_books ib ON b.id = ib.book_id
       GROUP BY b.id ORDER BY borrow_count DESC LIMIT 10`
    );

    const [activeStudents] = await pool.query(
      `SELECT u.id, u.name, u.email, COUNT(ib.id) as borrow_count
       FROM users u JOIN issued_books ib ON u.id = ib.user_id
       WHERE u.role = 'student'
       GROUP BY u.id ORDER BY borrow_count DESC LIMIT 10`
    );

    const [categoryPopularity] = await pool.query(
      `SELECT b.category, COUNT(ib.id) as borrow_count
       FROM books b JOIN issued_books ib ON b.id = ib.book_id
       GROUP BY b.category ORDER BY borrow_count DESC`
    );

    const [monthlyTrends] = await pool.query(
      `SELECT DATE_FORMAT(issue_date, '%Y-%m') as month, COUNT(*) as count
       FROM issued_books
       WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`
    );

    const [revenueByMonth] = await pool.query(
      `SELECT DATE_FORMAT(paid_at, '%Y-%m') as month, COALESCE(SUM(amount), 0) as total
       FROM fines WHERE status = 'paid' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`
    );

    res.json({ mostBorrowed, activeStudents, categoryPopularity, monthlyTrends, revenueByMonth });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [[{ totalBooks }]] = await pool.query('SELECT COUNT(*) as totalBooks FROM books');
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ activeLoans }]] = await pool.query("SELECT COUNT(*) as activeLoans FROM issued_books WHERE status = 'issued'");
    const [[{ overdueCount }]] = await pool.query("SELECT COUNT(*) as overdueCount FROM issued_books WHERE status = 'issued' AND due_date < CURDATE()");
    const [[{ totalResources }]] = await pool.query('SELECT COUNT(*) as totalResources FROM resources');
    const [recentActivity] = await pool.query(
      `SELECT 'issue' as type, ib.id, b.title, u.name, ib.issue_date as date
       FROM issued_books ib JOIN books b ON ib.book_id = b.id JOIN users u ON ib.user_id = u.id
       ORDER BY ib.issue_date DESC LIMIT 5`
    );

    res.json({ totalBooks, totalUsers, activeLoans, overdueCount, totalResources, recentActivity });
  } catch (error) {
    next(error);
  }
};
