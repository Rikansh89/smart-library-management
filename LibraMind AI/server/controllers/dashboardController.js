const { getDatabase } = require('../config/database');
const { calculateAndUpdateFines } = require('../services/fineService');
const { getRecommendations } = require('../services/geminiService');

exports.getStudentDashboard = async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    calculateAndUpdateFines(userId);

    const issuedBooks = db.prepare(`
      SELECT ib.*, b.title, b.author, b.isbn, b.cover_image, bc.copy_code
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.id
      JOIN book_copies bc ON ib.copy_id = bc.id
      WHERE ib.user_id = ? AND ib.status IN ('issued', 'overdue')
      ORDER BY ib.due_date ASC
    `).all(userId);

    const dueDates = issuedBooks.map(book => ({
      id: book.id,
      title: book.title,
      dueDate: book.due_date,
      status: book.status,
      daysRemaining: Math.ceil((new Date(book.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    const pendingFines = db.prepare(`
      SELECT SUM(amount - paid_amount) as total FROM fines WHERE user_id = ? AND status = 'pending'
    `).get(userId);

    const readingHistory = db.prepare(`
      SELECT rh.*, b.title, b.author, b.genre, b.cover_image
      FROM reading_history rh
      JOIN books b ON rh.book_id = b.id
      WHERE rh.user_id = ?
      ORDER BY rh.created_at DESC LIMIT 10
    `).all(userId);

    const allBooks = db.prepare('SELECT * FROM books WHERE is_active = 1').all();
    const recommendations = await getRecommendations(userId, readingHistory, allBooks);

    const readingStats = db.prepare(`
      SELECT COUNT(*) as totalBorrowed,
        SUM(CASE WHEN rh.completed = 1 THEN 1 ELSE 0 END) as completedBooks
      FROM reading_history rh WHERE rh.user_id = ?
    `).get(userId);

    const returnCount = db.prepare(`
      SELECT COUNT(*) as count FROM issued_books WHERE user_id = ? AND status = 'returned'
    `).get(userId);

    res.json({
      currentIssues: issuedBooks,
      dueDates,
      totalFines: pendingFines.total || 0,
      readingHistory,
      recommendations,
      stats: {
        totalBorrowed: readingStats.totalBorrowed || 0,
        completedBooks: readingStats.completedBooks || 0,
        returnedBooks: returnCount.count || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getLibrarianDashboard = (req, res, next) => {
  try {
    const db = getDatabase();

    calculateAndUpdateFines();

    const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books WHERE is_active = 1').get();
    const totalCopies = db.prepare('SELECT COUNT(*) as count FROM book_copies WHERE is_active = 1').get();
    const availableCopies = db.prepare("SELECT COUNT(*) as count FROM book_copies WHERE status = 'available' AND is_active = 1").get();
    const issuedCopies = db.prepare("SELECT COUNT(*) as count FROM book_copies WHERE status = 'issued' AND is_active = 1").get();

    const issuedBooks = db.prepare(`
      SELECT COUNT(*) as count FROM issued_books WHERE status IN ('issued', 'overdue')
    `).get();

    const returnedToday = db.prepare(`
      SELECT COUNT(*) as count FROM issued_books
      WHERE status = 'returned' AND DATE(return_date) = DATE('now')
    `).get();

    const overdueBooks = db.prepare(`
      SELECT ib.*, b.title, u.name as user_name, u.email, u.student_id
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.id
      JOIN users u ON ib.user_id = u.id
      WHERE ib.status IN ('issued', 'overdue') AND DATE(ib.due_date) < DATE('now')
      ORDER BY ib.due_date ASC
    `).all();

    const pendingReservations = db.prepare(`
      SELECT r.*, b.title, u.name as user_name
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.queue_position ASC, r.reservation_date ASC
    `).all();

    const recentActivity = db.prepare(`
      SELECT ib.*, b.title, u.name as user_name
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.id
      JOIN users u ON ib.user_id = u.id
      ORDER BY ib.created_at DESC LIMIT 10
    `).all();

    res.json({
      stats: {
        totalBooks: totalBooks.count,
        totalCopies: totalCopies.count,
        availableCopies: availableCopies.count,
        issuedCopies: issuedCopies.count,
        issuedBooks: issuedBooks.count,
        returnedToday: returnedToday.count,
        overdueCount: overdueBooks.length,
        pendingReservations: pendingReservations.length
      },
      overdueBooks,
      pendingReservations,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminDashboard = (req, res, next) => {
  try {
    const db = getDatabase();

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get();
    const students = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get();
    const librarians = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'librarian'").get();

    const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books WHERE is_active = 1').get();

    const totalIssues = db.prepare('SELECT COUNT(*) as count FROM issued_books').get();
    const activeIssues = db.prepare("SELECT COUNT(*) as count FROM issued_books WHERE status IN ('issued', 'overdue')").get();
    const returnedBooks = db.prepare("SELECT COUNT(*) as count FROM issued_books WHERE status = 'returned'").get();

    const totalFines = db.prepare("SELECT SUM(amount) as total FROM fines WHERE status = 'paid'").get();
    const pendingFines = db.prepare("SELECT SUM(amount - paid_amount) as total FROM fines WHERE status = 'pending'").get();
    const totalFineAmount = db.prepare("SELECT SUM(amount) as total FROM fines").get();

    const mostBorrowed = db.prepare(`
      SELECT b.id, b.title, b.author, b.borrow_count, b.cover_image
      FROM books b WHERE b.is_active = 1
      ORDER BY b.borrow_count DESC LIMIT 10
    `).all();

    const recentRegistrations = db.prepare(`
      SELECT id, name, email, role, created_at FROM users
      ORDER BY created_at DESC LIMIT 10
    `).all();

    const issueStats = db.prepare(`
      SELECT DATE(issue_date) as date, COUNT(*) as count
      FROM issued_books
      WHERE issue_date >= DATE('now', '-30 days')
      GROUP BY DATE(issue_date)
      ORDER BY date ASC
    `).all();

    const categoryUsage = db.prepare(`
      SELECT b.category, COUNT(*) as count
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.id
      WHERE b.category IS NOT NULL
      GROUP BY b.category
      ORDER BY count DESC
    `).all();

    res.json({
      userStats: {
        total: totalUsers.count,
        active: activeUsers.count,
        students: students.count,
        librarians: librarians.count
      },
      bookStats: {
        total: totalBooks.count
      },
      issueStats: {
        total: totalIssues.count,
        active: activeIssues.count,
        returned: returnedBooks.count
      },
      revenue: {
        totalCollected: totalFines.total || 0,
        pendingCollection: pendingFines.total || 0,
        totalFines: totalFineAmount.total || 0
      },
      mostBorrowed,
      recentRegistrations,
      borrowingTrends: issueStats,
      categoryUsage
    });
  } catch (error) {
    next(error);
  }
};
