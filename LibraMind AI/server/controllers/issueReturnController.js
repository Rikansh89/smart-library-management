const { getDatabase } = require('../config/database');
const { calculateFine, calculateAndUpdateFines } = require('../services/fineService');
const logger = require('../services/loggerService');

const BORROW_DURATION_DAYS = 14;
const MAX_RENEWALS = 2;
const RENEWAL_DAYS = 7;

exports.issueBook = (req, res, next) => {
  try {
    const { user_id, book_id } = req.body;
    const db = getDatabase();

    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ? AND is_active = 1').get(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    const book = db.prepare('SELECT * FROM books WHERE id = ? AND is_active = 1').get(book_id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const existingIssues = db.prepare(
      "SELECT COUNT(*) as count FROM issued_books WHERE user_id = ? AND status IN ('issued', 'overdue')"
    ).get(user_id);

    if (existingIssues.count >= 5) {
      return res.status(400).json({ error: 'User has reached maximum borrowing limit (5 books)' });
    }

    const availableCopy = db.prepare(
      "SELECT * FROM book_copies WHERE book_id = ? AND status = 'available' AND is_active = 1 LIMIT 1"
    ).get(book_id);

    if (!availableCopy) {
      const reservation = db.prepare(
        "SELECT id FROM reservations WHERE user_id = ? AND book_id = ? AND status = 'pending'"
      ).get(user_id, book_id);

      if (!reservation) {
        const queueCount = db.prepare(
          "SELECT COUNT(*) as count FROM reservations WHERE book_id = ? AND status = 'pending'"
        ).get(book_id);

        db.prepare(`
          INSERT INTO reservations (user_id, book_id, status, queue_position, expiry_date)
          VALUES (?, ?, 'pending', ?, datetime('now', '+2 days'))
        `).run(user_id, book_id, queueCount.count + 1);

        logger.info(`Reservation created: User ${user_id} for Book ${book_id}`);

        return res.status(200).json({
          message: 'No copies available. You have been added to the reservation queue.',
          reservation: { position: queueCount.count + 1 }
        });
      }

      return res.status(400).json({ error: 'No available copies and you already have a reservation' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

    const result = db.prepare(`
      INSERT INTO issued_books (user_id, copy_id, book_id, due_date, status, issued_by)
      VALUES (?, ?, ?, ?, 'issued', ?)
    `).run(user_id, availableCopy.id, book_id, dueDate.toISOString(), req.user.id);

    db.prepare("UPDATE book_copies SET status = 'issued' WHERE id = ?").run(availableCopy.id);
    db.prepare('UPDATE books SET borrow_count = borrow_count + 1 WHERE id = ?').run(book_id);

    db.prepare(`
      INSERT INTO reading_history (user_id, book_id, issued_book_id, started_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(user_id, book_id, result.lastInsertRowid);

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'general', 'Book Issued', ?)
    `).run(user_id, `You have issued "${book.title}". Due date: ${dueDate.toLocaleDateString()}`);

    logger.info(`Book issued: ${book.title} to User ${user_id}`);

    res.status(201).json({
      message: 'Book issued successfully',
      issue: {
        id: result.lastInsertRowid,
        book: book.title,
        dueDate: dueDate.toISOString(),
        copyCode: availableCopy.copy_code
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.returnBook = (req, res, next) => {
  try {
    const { issued_book_id } = req.body;
    const db = getDatabase();

    const issued = db.prepare(`
      SELECT ib.*, b.title, b.id as book_id, bc.copy_code
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.id
      JOIN book_copies bc ON ib.copy_id = bc.id
      WHERE ib.id = ? AND ib.status IN ('issued', 'overdue')
    `).get(issued_book_id);

    if (!issued) {
      return res.status(404).json({ error: 'Issue record not found or already returned' });
    }

    const returnDate = new Date().toISOString();
    const fineAmount = calculateFine(issued.due_date);

    db.prepare(`
      UPDATE issued_books SET return_date = ?, status = 'returned', updated_at = datetime('now')
      WHERE id = ?
    `).run(returnDate, issued_book_id);

    db.prepare("UPDATE book_copies SET status = 'available' WHERE id = ?").run(issued.copy_id);

    if (fineAmount > 0) {
      db.prepare(`
        INSERT INTO fines (user_id, issued_book_id, amount, reason, status)
        VALUES (?, ?, ?, 'Late return fine', 'pending')
      `).run(issued.user_id, issued_book_id, fineAmount);

      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'fine', 'Fine Incurred', ?)
      `).run(issued.user_id, `Late return fine of $${fineAmount.toFixed(2)} for "${issued.title}"`);
    }

    db.prepare(`
      UPDATE reading_history SET completed = 1, completed_at = datetime('now')
      WHERE issued_book_id = ?
    `).run(issued_book_id);

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'general', 'Book Returned', ?)
    `).run(issued.user_id, `"${issued.title}" returned successfully. ${fineAmount > 0 ? `Fine: $${fineAmount.toFixed(2)}` : ''}`);

    const pendingReservation = db.prepare(`
      SELECT * FROM reservations WHERE book_id = ? AND status = 'pending'
      ORDER BY queue_position ASC, reservation_date ASC LIMIT 1
    `).get(issued.book_id);

    if (pendingReservation) {
      const copy = db.prepare("SELECT id FROM book_copies WHERE book_id = ? AND status = 'available' LIMIT 1").get(issued.book_id);
      if (copy) {
        db.prepare("UPDATE reservations SET status = 'fulfilled', copy_id = ?, notified = 1 WHERE id = ?")
          .run(copy.id, pendingReservation.id);

        db.prepare(`
          INSERT INTO notifications (user_id, type, title, message)
          VALUES (?, 'reservation', 'Reservation Available', ?)
        `).run(pendingReservation.user_id, `"${issued.title}" is now available for you to borrow.`);
      }
    }

    logger.info(`Book returned: ${issued.title}`);

    res.json({
      message: 'Book returned successfully',
      fine: fineAmount > 0 ? { amount: fineAmount, status: 'pending' } : null
    });
  } catch (error) {
    next(error);
  }
};

exports.renewBook = (req, res, next) => {
  try {
    const { issued_book_id } = req.body;
    const db = getDatabase();

    const issued = db.prepare(`
      SELECT ib.*, b.title
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.id
      WHERE ib.id = ? AND ib.user_id = ? AND ib.status = 'issued'
    `).get(issued_book_id, req.user.id);

    if (!issued) {
      return res.status(404).json({ error: 'Issue record not found or cannot be renewed' });
    }

    if (issued.renewed_count >= MAX_RENEWALS) {
      return res.status(400).json({ error: 'Maximum renewal limit reached' });
    }

    const reservation = db.prepare(
      "SELECT id FROM reservations WHERE book_id = ? AND status = 'pending'"
    ).get(issued.book_id);

    if (reservation) {
      return res.status(400).json({ error: 'Cannot renew: another user has reserved this book' });
    }

    const newDueDate = new Date(issued.due_date);
    newDueDate.setDate(newDueDate.getDate() + RENEWAL_DAYS);

    db.prepare(`
      UPDATE issued_books SET due_date = ?, renewed_count = renewed_count + 1, status = 'renewed', updated_at = datetime('now')
      WHERE id = ?
    `).run(newDueDate.toISOString(), issued_book_id);

    logger.info(`Book renewed: ${issued.title} by User ${req.user.id}`);

    res.json({
      message: 'Book renewed successfully',
      newDueDate: newDueDate.toISOString(),
      renewedCount: issued.renewed_count + 1
    });
  } catch (error) {
    next(error);
  }
};

exports.getIssuedBooks = (req, res, next) => {
  try {
    const db = getDatabase();
    const { status, user_id } = req.query;

    let query = `
      SELECT ib.*, b.title, b.author, b.isbn, b.cover_image, bc.copy_code,
        u.name as user_name, u.email as user_email, u.student_id
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.id
      JOIN book_copies bc ON ib.copy_id = bc.id
      JOIN users u ON ib.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND ib.status = ?';
      params.push(status);
    }

    if (user_id) {
      query += ' AND ib.user_id = ?';
      params.push(user_id);
    } else if (req.user.role === 'student') {
      query += ' AND ib.user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY ib.issue_date DESC';

    const books = db.prepare(query).all(...params);

    const booksWithFine = books.map(book => {
      if (book.status === 'returned' || book.status === 'overdue') {
        const fine = db.prepare('SELECT * FROM fines WHERE issued_book_id = ?').get(book.id);
        return { ...book, fine: fine || null };
      }
      return { ...book, fine: null };
    });

    res.json({ books: booksWithFine });
  } catch (error) {
    next(error);
  }
};

exports.getMyIssues = (req, res, next) => {
  req.query.user_id = req.user.id;
  return exports.getIssuedBooks(req, res, next);
};

exports.getReservations = (req, res, next) => {
  try {
    const db = getDatabase();
    const { status } = req.query;

    let query = `
      SELECT r.*, b.title, b.author, b.isbn, b.cover_image
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (req.user.role === 'student') {
      query += ' AND r.user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY r.reservation_date DESC';

    const reservations = db.prepare(query).all(...params);
    res.json({ reservations });
  } catch (error) {
    next(error);
  }
};

exports.cancelReservation = (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (req.user.role === 'student' && reservation.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.prepare("UPDATE reservations SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);

    res.json({ message: 'Reservation cancelled' });
  } catch (error) {
    next(error);
  }
};
