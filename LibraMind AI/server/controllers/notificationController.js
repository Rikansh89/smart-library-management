const { getDatabase } = require('../config/database');
const { sendDueDateReminder, sendOverdueAlert } = require('../services/emailService');
const logger = require('../services/loggerService');

exports.getNotifications = (req, res, next) => {
  try {
    const db = getDatabase();
    const notifications = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(req.user.id);

    const unreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.user.id);

    res.json({ notifications, unreadCount: unreadCount.count });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .run(id, req.user.id);

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = (req, res, next) => {
  try {
    const db = getDatabase();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.sendDueDateReminders = async (req, res, next) => {
  try {
    const db = getDatabase();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dueBooks = db.prepare(`
      SELECT ib.*, u.email, u.name as user_name, b.title, b.author
      FROM issued_books ib
      JOIN users u ON ib.user_id = u.id
      JOIN books b ON ib.book_id = b.id
      WHERE DATE(ib.due_date) = ? AND ib.status = 'issued'
    `).all(tomorrowStr);

    const results = [];
    for (const book of dueBooks) {
      try {
        await sendDueDateReminder(
          { name: book.user_name, email: book.email },
          { title: book.title },
          book.due_date
        );

        db.prepare(`
          INSERT INTO notifications (user_id, type, title, message)
          VALUES (?, 'due_date', 'Due Date Tomorrow', ?)
        `).run(book.user_id, `"${book.title}" is due tomorrow (${new Date(book.due_date).toLocaleDateString()}).`);

        results.push({ userId: book.user_id, book: book.title, sent: true });
      } catch (error) {
        results.push({ userId: book.user_id, book: book.title, sent: false, error: error.message });
      }
    }

    res.json({ message: 'Reminders processed', results });
  } catch (error) {
    next(error);
  }
};

exports.sendOverdueAlerts = async (req, res, next) => {
  try {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const overdueBooks = db.prepare(`
      SELECT ib.*, u.email, u.name as user_name, b.title, b.author,
        CAST(julianday(datetime('now')) - julianday(ib.due_date) AS INTEGER) as days_overdue
      FROM issued_books ib
      JOIN users u ON ib.user_id = u.id
      JOIN books b ON ib.book_id = b.id
      WHERE DATE(ib.due_date) < ? AND ib.status IN ('issued', 'overdue')
    `).all(today);

    const results = [];
    for (const book of overdueBooks) {
      const fine = book.days_overdue * 0.50;

      try {
        await sendOverdueAlert(
          { name: book.user_name, email: book.email },
          { title: book.title },
          fine
        );

        results.push({ userId: book.user_id, book: book.title, fine, sent: true });
      } catch (error) {
        results.push({ userId: book.user_id, book: book.title, fine, sent: false });
      }
    }

    res.json({ message: 'Overdue alerts processed', results, total: overdueBooks.length });
  } catch (error) {
    next(error);
  }
};
