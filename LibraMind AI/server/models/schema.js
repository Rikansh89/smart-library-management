const { getDatabase } = require('../config/database');

function initializeDatabase() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('student', 'librarian', 'admin')) DEFAULT 'student',
      profile_pic TEXT DEFAULT NULL,
      department TEXT DEFAULT NULL,
      student_id TEXT DEFAULT NULL,
      phone TEXT DEFAULT NULL,
      address TEXT DEFAULT NULL,
      reset_token TEXT DEFAULT NULL,
      reset_token_expiry TEXT DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      genre TEXT DEFAULT NULL,
      category TEXT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      publisher TEXT DEFAULT NULL,
      published_year INTEGER DEFAULT NULL,
      pages INTEGER DEFAULT NULL,
      cover_image TEXT DEFAULT NULL,
      shelf_location TEXT DEFAULT NULL,
      average_rating REAL DEFAULT 0,
      borrow_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS book_copies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      copy_code TEXT UNIQUE NOT NULL,
      status TEXT CHECK(status IN ('available', 'issued', 'reserved', 'damaged', 'lost')) DEFAULT 'available',
      location TEXT DEFAULT NULL,
      purchase_date TEXT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS issued_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      copy_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      issue_date TEXT DEFAULT (datetime('now')),
      due_date TEXT NOT NULL,
      return_date TEXT DEFAULT NULL,
      status TEXT CHECK(status IN ('issued', 'returned', 'renewed', 'overdue')) DEFAULT 'issued',
      renewed_count INTEGER DEFAULT 0,
      issued_by INTEGER DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (copy_id) REFERENCES book_copies(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      copy_id INTEGER DEFAULT NULL,
      reservation_date TEXT DEFAULT (datetime('now')),
      expiry_date TEXT DEFAULT NULL,
      status TEXT CHECK(status IN ('pending', 'fulfilled', 'cancelled', 'expired')) DEFAULT 'pending',
      notified INTEGER DEFAULT 0,
      queue_position INTEGER DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (copy_id) REFERENCES book_copies(id)
    );

    CREATE TABLE IF NOT EXISTS fines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      issued_book_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      reason TEXT DEFAULT NULL,
      status TEXT CHECK(status IN ('pending', 'paid', 'waived')) DEFAULT 'pending',
      paid_date TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (issued_book_id) REFERENCES issued_books(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('due_date', 'overdue', 'reservation', 'general', 'fine')) DEFAULT 'general',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      related_id INTEGER DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reading_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      issued_book_id INTEGER DEFAULT NULL,
      pages_read INTEGER DEFAULT 0,
      rating INTEGER DEFAULT NULL,
      review TEXT DEFAULT NULL,
      completed INTEGER DEFAULT 0,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (issued_book_id) REFERENCES issued_books(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT NULL,
      action TEXT NOT NULL,
      entity_type TEXT DEFAULT NULL,
      entity_id INTEGER DEFAULT NULL,
      details TEXT DEFAULT NULL,
      ip_address TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('Database tables initialized successfully');
}

module.exports = { initializeDatabase };
