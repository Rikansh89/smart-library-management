const { getDatabase } = require('../config/database');

const FINE_PER_DAY = 0.50;
const GRACE_PERIOD_DAYS = 0;

function calculateFine(dueDate, returnDate = null) {
  const due = new Date(dueDate);
  const returned = returnDate ? new Date(returnDate) : new Date();
  const diffTime = returned - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= GRACE_PERIOD_DAYS) return 0;
  return diffDays * FINE_PER_DAY;
}

function calculateAndUpdateFines(userId = null) {
  const db = getDatabase();
  let query = `
    SELECT ib.id, ib.user_id, ib.due_date, ib.return_date, ib.status
    FROM issued_books ib
    WHERE ib.status IN ('issued', 'overdue')
  `;
  const params = [];

  if (userId) {
    query += ' AND ib.user_id = ?';
    params.push(userId);
  }

  const overdueBooks = db.prepare(query).all(...params);
  const now = new Date().toISOString();
  const updates = [];

  for (const book of overdueBooks) {
    const fine = calculateFine(book.due_date, book.return_date);

    if (fine > 0) {
      const existingFine = db.prepare(
        'SELECT id, status FROM fines WHERE issued_book_id = ? AND status = ?'
      ).get(book.id, 'pending');

      if (!existingFine) {
        db.prepare(`
          INSERT INTO fines (user_id, issued_book_id, amount, reason, status, created_at)
          VALUES (?, ?, ?, 'Overdue fine - auto calculated', 'pending', ?)
        `).run(book.user_id, book.id, fine, now);
        updates.push({ bookId: book.id, fine });
      } else if (existingFine.status === 'pending') {
        db.prepare('UPDATE fines SET amount = ?, updated_at = ? WHERE id = ?')
          .run(fine, now, existingFine.id);
      }

      if (book.status === 'issued') {
        db.prepare('UPDATE issued_books SET status = ? WHERE id = ?')
          .run('overdue', book.id);
      }

      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, created_at)
        VALUES (?, 'overdue', 'Book Overdue', ?, ?)
      `).run(
        book.user_id,
        `Your book (ID: ${book.id}) is overdue. Fine: $${fine.toFixed(2)}`,
        now
      );
    }
  }

  return updates;
}

async function payFine(fineId, userId, amount) {
  const db = getDatabase();
  const fine = db.prepare('SELECT * FROM fines WHERE id = ? AND user_id = ?').get(fineId, userId);

  if (!fine) {
    throw new Error('Fine not found');
  }

  if (fine.status === 'paid') {
    throw new Error('Fine already paid');
  }

  const remainingAmount = fine.amount - fine.paid_amount;
  const paidAmount = Math.min(amount, remainingAmount);
  const newPaidAmount = fine.paid_amount + paidAmount;

  if (newPaidAmount >= fine.amount) {
    db.prepare('UPDATE fines SET paid_amount = ?, status = ?, paid_date = ? WHERE id = ?')
      .run(newPaidAmount, 'paid', new Date().toISOString(), fineId);
  } else {
    db.prepare('UPDATE fines SET paid_amount = ? WHERE id = ?')
      .run(newPaidAmount, fineId);
  }

  return { success: true, paid: paidAmount, remaining: fine.amount - newPaidAmount };
}

module.exports = { calculateFine, calculateAndUpdateFines, payFine, FINE_PER_DAY };
